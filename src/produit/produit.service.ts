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
}
