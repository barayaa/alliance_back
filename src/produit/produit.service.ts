import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produit } from './produit.entity';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';

@Injectable()
export class ProduitService {
  constructor(
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(MMvtStock)
    private mvtStockRepository: Repository<MMvtStock>,
  ) {}

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

  async findAllForExport(searchTerm?: string): Promise<Produit[]> {
    return this.findAll(searchTerm);
  }

  // async findAll(): Promise<Produit[]> {
  //   return this.produitRepository.find({
  //     relations: {
  //       marque: true,
  //       forme: true,
  //       voie_administration: true,
  //       classe_therapeutique: true,
  //       statut_produit: true,
  //       titulaire_amm: true,
  //       fabricant: true,
  //       // lignescommandeventes: true,
  //     },
  //     order: {
  //       produit: 'ASC',
  //     },
  //   });
  // }

  async findOne(id: number): Promise<Produit> {
    const entity = await this.produitRepository.findOne({
      where: { id_produit: id },
      relations: [
        'marque',
        'forme',
        'voie_administration',
        'classe_therapeutique',
        'statut_produit',
        'titulaire_amm',
        'fabricant',
        'lignescommandeventes',
      ],
    });
    if (!entity) throw new NotFoundException('Produit not found');
    return entity;
  }

  async create(dto: CreateProduitDto): Promise<Produit> {
    return;
    // const entity = this.produitRepository.create(dto);
    // return this.produitRepository.save(entity);
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

  // async getStockState(date?: string): Promise<any> {
  //   const query = this.produitRepository
  //     .createQueryBuilder('produit')
  //     .leftJoinAndSelect('produit.marque', 'marque')
  //     .leftJoinAndSelect('produit.forme', 'forme')
  //     .where('produit.produit != :timbre', { timbre: 'Timbre fiscale' })
  //     .select([
  //       'produit.id_produit',
  //       'produit.produit AS designation',
  //       'marque.marque AS brand',
  //       'produit.dosage',
  //       'forme.forme AS form',
  //       'produit.presentation',
  //       'produit.prix_unitaire',
  //     ]);

  //   const products = await query.getRawMany();
  //   const targetDate = date || new Date().toISOString().split('T')[0];

  //   const stockData = await Promise.all(
  //     products.map(async (item) => {
  //       // Récupérer tous les mouvements pour ce produit jusqu'à la date
  //       const movements = await this.mvtStockRepository
  //         .createQueryBuilder('mvt')
  //         .leftJoin('mvt.produit', 'produit') // Lien pour prix_unitaire
  //         .where('mvt.id_produit = :id', { id: item.id_produit })
  //         .andWhere('mvt.date <= :date', { date: targetDate })
  //         .select([
  //           'mvt.id_produit',
  //           'mvt.date',
  //           'mvt.quantite',
  //           'mvt.stock_avant',
  //           'mvt.stock_apres',
  //           'produit.prix_unitaire AS produit_prix_unitaire',
  //         ])
  //         .orderBy('mvt.date', 'ASC')
  //         .getRawMany();

  //       let latestStock = 0;
  //       if (movements.length > 0) {
  //         latestStock = movements[movements.length - 1].stock_apres; // Dernier stock_apres
  //       } else {
  //         latestStock = item.stock_courant || 0; // Fallback si pas de mouvement
  //       }

  //       const value = latestStock * (item.prix_unitaire || 0);
  //       console.log(
  //         `Produit ${item.designation} (ID: ${item.id_produit}): Stock = ${latestStock}, Valeur = ${value}, Date = ${targetDate}`,
  //       );

  //       return {
  //         ...item,
  //         stock: latestStock,
  //         value,
  //         movements, // Tous les mouvements pour ce produit
  //       };
  //     }),
  //   );

  //   const totalValue = stockData.reduce(
  //     (sum, item) => sum + (item.value || 0),
  //     0,
  //   );

  //   return {
  //     items: stockData,
  //     totalValue,
  //   };
  // }
}
