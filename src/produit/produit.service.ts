import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produit } from './produit.entity';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';
import { Audit } from 'src/audit/entities/audit.entity';
import { CorrectStockDto } from './dto/correct-produit.dto';

@Injectable()
export class ProduitService {
  constructor(
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(MMvtStock)
    private mvtStockRepository: Repository<MMvtStock>,

    @InjectRepository(Audit)
    private auditRepository: Repository<Audit>,
  ) {}

  async correctStockWithAudit(
    id: number,
    dto: CorrectStockDto,
  ): Promise<Produit> {
    const produit = await this.produitRepository.findOne({
      where: { id_produit: id },
    });

    if (!produit) {
      throw new HttpException(
        `Produit avec ID ${id} non trouvé`,
        HttpStatus.NOT_FOUND,
      );
    }

    const old_stock = produit.stock_courant;
    const new_stock = dto.new_stock;
    const difference = new_stock - old_stock;

    // Déterminer le type de correction pour l'audit
    let type_correction: string;
    if (difference > 0) {
      type_correction = 'ajout';
    } else if (difference < 0) {
      type_correction = 'diminution';
    } else {
      type_correction = 'verification';
    }

    // Mise à jour du stock courant
    produit.stock_courant = new_stock;
    produit.stock_courant_date = Date.now();

    await this.produitRepository.save(produit);

    // Enregistrer l'action dans la table Audit
    const audit = this.auditRepository.create({
      produit: produit,
      stock_courant_avant: old_stock,
      stock_physique: new_stock,
      difference: difference,
      type_correction: type_correction,
      description: dto.description,
      user_id: dto.user_id,
      user_nom: dto.user_nom,
      date_audit: new Date(),
    });

    await this.auditRepository.save(audit);

    // Créer un mouvement de stock pour correction d'inventaire
    const mouvementStock = this.mvtStockRepository.create({
      id_produit: produit.id_produit,
      produit: produit,
      quantite: Math.abs(difference), // Quantité corrigée (positive)
      stock_avant: old_stock,
      stock_apres: new_stock,
      type: 5, // Type pour "Correction d’inventaire"
      date: new Date(),
      user: dto.user_nom,
      commentaire:
        dto.description || `Correction d’inventaire: ${type_correction}`,
      magasin: 1, // Valeur par défaut (à ajuster si nécessaire)
      cout: produit.prix_vente || 0, // Ajuster selon la propriété correcte
      annule: 'non',
      id_commande_vente: null, // Pas de commande associée
      num_lot: null,
      date_expiration: produit.validite_amm || null,
      conformite: null,
    });

    try {
      await this.mvtStockRepository.save(mouvementStock);
    } catch (error) {
      throw new HttpException(
        `Erreur lors de l'enregistrement du mouvement de stock: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return produit;
  }

  // async correctStockWithAudit(
  //   id: number,
  //   dto: CorrectStockDto,
  // ): Promise<Produit> {
  //   const produit = await this.produitRepository.findOne({
  //     where: { id_produit: id },
  //   });

  //   if (!produit) {
  //     throw new HttpException(
  //       `Produit avec ID ${id} non trouvé`,
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }

  //   const old_stock = produit.stock_courant;
  //   const new_stock = dto.new_stock;
  //   const difference = new_stock - old_stock;

  //   // Déterminer le type de correction
  //   let type_correction: string;
  //   if (difference > 0) {
  //     type_correction = 'ajout';
  //   } else if (difference < 0) {
  //     type_correction = 'diminution';
  //   } else {
  //     type_correction = 'verification';
  //   }

  //   // Mise à jour du stock courant
  //   produit.stock_courant = new_stock;
  //   produit.stock_courant_date = Date.now();

  //   await this.produitRepository.save(produit);

  //   // Enregistrer l'action dans la table Audit
  //   const audit = this.auditRepository.create({
  //     produit: produit,
  //     stock_courant_avant: old_stock,
  //     stock_physique: new_stock,
  //     difference: difference,
  //     type_correction: type_correction,
  //     description: dto.description,
  //     user_id: dto.user_id,
  //     user_nom: dto.user_nom,
  //     date_audit: new Date(),
  //   });

  //   await this.auditRepository.save(audit);

  //   return produit;
  // }

  async findAll(searchTerm?: string): Promise<Produit[]> {
    const query = this.produitRepository
      .createQueryBuilder('produit')
      .leftJoinAndSelect('produit.marque', 'marque')
      .leftJoinAndSelect('produit.forme', 'forme')
      .leftJoinAndSelect('produit.voie_administration', 'voie_administration')
      .leftJoinAndSelect('produit.classe_therapeutique', 'classe_therapeutique')
      .leftJoinAndSelect('produit.statut_produit', 'statut_produit')
      .leftJoinAndSelect('produit.titulaire_amm', 'titulaire_amm')
      .leftJoinAndSelect('produit.fabricant', 'fabricant')
      .where('produit.produit != :timbre', { timbre: 'Timbre fiscale' })
      .orderBy('produit.produit', 'ASC');

    if (searchTerm) {
      const searchLower = `%${searchTerm.toLowerCase()}%`;
      query.andWhere(
        `(
          LOWER(produit.produit) LIKE :search OR
          LOWER(produit.dosage) LIKE :search OR
          LOWER(marque.marque) LIKE :search OR
          LOWER(forme.forme) LIKE :search OR
          LOWER(classe_therapeutique.classe_therapeutique) LIKE :search OR
          LOWER(titulaire_amm.titulaire_amm) LIKE :search
        )`,
        { search: searchLower },
      );
    }

    return query.getMany();
  }

  // async findAllForExport(searchTerm?: string): Promise<Produit[]> {
  //   return this.findAll(searchTerm);
  // }

  async findAllForExport(searchTerm?: string): Promise<Produit[]> {
    console.log('findAllForExport appelé avec searchTerm:', searchTerm);
    const produits = await this.findAll(searchTerm);
    // Log pour vérifier si ACFOL est inclus
    const acfol = produits.find((p) => p.id_produit === 409);
    console.log('Produit ACFOL dans findAllForExport:', acfol || 'Non trouvé');
    return produits;
  }

  async findOne(id: number): Promise<Produit> {
    const entity = await this.produitRepository.findOne({
      where: { id_produit: id },
      select: ['id_produit', 'produit'], // Utiliser 'produit' au lieu de 'nom' conformément à l'entité
    });
    if (!entity)
      throw new NotFoundException(`Produit avec ID ${id} non trouvé`);
    return entity;
  }

  async create(dto: CreateProduitDto): Promise<Produit> {
    return;
  }

  async update(id: number, dto: UpdateProduitDto): Promise<Produit> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.produitRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.produitRepository.remove(entity);
  }

  async getProduitsExpirantDansSixMois(): Promise<Produit[]> {
    const aujourdHui = new Date();
    const dansSixMois = new Date();
    dansSixMois.setMonth(aujourdHui.getMonth() + 6);

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    };

    const dateDebut = formatDate(aujourdHui);
    const dateFin = formatDate(dansSixMois);

    console.log('Date début:', dateDebut);
    console.log('Date fin:', dateFin);

    return await this.produitRepository
      .createQueryBuilder('produit')
      .leftJoinAndSelect('produit.marque', 'marque')
      .leftJoinAndSelect('produit.forme', 'forme')
      .leftJoinAndSelect('produit.voie_administration', 'voie_administration')
      .leftJoinAndSelect('produit.classe_therapeutique', 'classe_therapeutique')
      .leftJoinAndSelect('produit.statut_produit', 'statut_produit')
      .leftJoinAndSelect('produit.titulaire_amm', 'titulaire_amm')
      .leftJoinAndSelect('produit.fabricant', 'fabricant')
      .where(
        'STR_TO_DATE(produit.validite_amm, "%d/%m/%Y") >= STR_TO_DATE(:dateDebut, "%d/%m/%Y")',
        { dateDebut },
      )
      .andWhere(
        'STR_TO_DATE(produit.validite_amm, "%d/%m/%Y") <= STR_TO_DATE(:dateFin, "%d/%m/%Y")',
        { dateFin },
      )
      .andWhere('produit.validite_amm IS NOT NULL')
      .orderBy('STR_TO_DATE(produit.validite_amm, "%d/%m/%Y")', 'ASC')
      .getMany();
  }

  async getProduitsPerimes(): Promise<Produit[]> {
    const aujourdHui = new Date();

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    };

    const dateActuelle = formatDate(aujourdHui);

    return await this.produitRepository
      .createQueryBuilder('produit')
      .leftJoinAndSelect('produit.marque', 'marque')
      .leftJoinAndSelect('produit.forme', 'forme')
      .leftJoinAndSelect('produit.voie_administration', 'voie_administration')
      .leftJoinAndSelect('produit.classe_therapeutique', 'classe_therapeutique')
      .leftJoinAndSelect('produit.statut_produit', 'statut_produit')
      .leftJoinAndSelect('produit.titulaire_amm', 'titulaire_amm')
      .leftJoinAndSelect('produit.fabricant', 'fabricant')
      .where(
        'STR_TO_DATE(produit.validite_amm, "%d/%m/%Y") <= STR_TO_DATE(:dateActuelle, "%d/%m/%Y")',
        { dateActuelle },
      )
      .andWhere('produit.validite_amm IS NOT NULL')
      .orderBy('STR_TO_DATE(produit.validite_amm, "%d/%m/%Y")', 'ASC')
      .getMany();
  }

  async getStockValue(dto: {
    date_debut?: string;
    date_fin?: string;
  }): Promise<number> {
    try {
      const produits = await this.produitRepository
        .createQueryBuilder('produit')
        .select(['produit.stock_courant', 'produit.prix_unitaire'])
        .where('produit.produit != :timbre', { timbre: 'Timbre fiscale' })
        .getRawMany();

      return produits.reduce(
        (sum, p) =>
          sum + (p.produit_stock_courant || 0) * (p.produit_prix_unitaire || 0),
        0,
      );
    } catch (error) {
      throw new HttpException(
        'Erreur lors du calcul de la valeur du stock',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // async getStockValue(dto: {
  //   date_debut?: string;
  //   date_fin?: string;
  // }): Promise<number> {
  //   try {
  //     const produits = await this.produitRepository.find({
  //       select: ['stock_courant', 'prix_unitaire'],
  //     });
  //     return produits.reduce(
  //       (sum, p) => sum + (p.stock_courant || 0) * (p.prix_unitaire || 0),
  //       0,
  //     );
  //   } catch (error) {
  //     throw new HttpException(
  //       'Erreur lors du calcul de la valeur du stock',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  async getStockByProduct(dto: {
    date_debut?: string;
    date_fin?: string;
  }): Promise<{ produit: string; quantite: number }[]> {
    try {
      const produits = await this.produitRepository.find({
        select: ['produit', 'stock_courant'],
      });
      return produits.map((p) => ({
        produit: p.produit,
        quantite: p.stock_courant || 0,
      }));
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération des stocks par produit',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async exportAllProducts(searchTerm?: string): Promise<
    {
      produit: string;
      prix_unitaire: number;
      stock_courant: number;
      total: number;
    }[]
  > {
    try {
      const produits = await this.produitRepository
        .createQueryBuilder('produit')
        .select([
          'produit.produit AS produit',
          'produit.prix_unitaire AS prix_unitaire',
          'produit.stock_courant AS stock_courant',
        ])
        .where('produit.produit != :timbre', { timbre: 'Timbre fiscale' })
        .orderBy('produit.produit', 'ASC')
        .getRawMany();

      return produits.map((p) => ({
        produit: p.produit,
        prix_unitaire: p.prix_unitaire || 0,
        stock_courant: p.stock_courant || 0,
        total: (p.prix_unitaire || 0) * (p.stock_courant || 0),
      }));
    } catch (error) {
      throw new HttpException(
        "Erreur lors de l'exportation des produits",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
