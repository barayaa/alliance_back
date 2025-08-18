import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TitulaireAmm } from './titulaire_amm.entity';
import { CreateTitulaireAmmDto } from './dto/create-titulaire_amm.dto';
import { UpdateTitulaireAmmDto } from './dto/update-titulaire_amm.dto';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Produit } from '../produit/produit.entity';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';
@Injectable()
export class TitulaireAmmService {
  constructor(
    // @InjectRepository(TitulaireAmm)
    // private titulaire_ammRepository: Repository<TitulaireAmm>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(TitulaireAmm)
    private titulaireAmmRepository: Repository<TitulaireAmm>,

    @InjectRepository(CommandeVente)
    private commandeVenteRepository: Repository<CommandeVente>,

    @InjectRepository(LignesCommandeVente)
    private lignesCommandeVenteRepository: Repository<LignesCommandeVente>,
  ) {}

  async findAll(searchTerm?: string): Promise<TitulaireAmm[]> {
    console.log('findAll called with:', { searchTerm });
    const queryBuilder = this.titulaireAmmRepository.createQueryBuilder('t');
    if (searchTerm) {
      queryBuilder.where('t.titulaire_amm LIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`,
      });
    }
    console.log(
      'Executing findAll query:',
      queryBuilder.getQueryAndParameters(),
    );
    try {
      const results = await queryBuilder.getMany();
      console.log('Titulaires AMM data:', results);
      return results;
    } catch (error) {
      console.error('findAll query failed:', error);
      throw new InternalServerErrorException(
        `Failed to execute findAll query: ${error.message}`,
      );
    }
  }
  async findOne(id: number): Promise<any> {
    try {
      const titulaire = await this.titulaireAmmRepository.findOne({
        where: { id_titulaire_amm: id },
      });
      if (!titulaire) {
        throw new NotFoundException(`Titulaire AMM with ID ${id} not found`);
      }

      const produits = await this.produitRepository
        .createQueryBuilder('p')
        .where('p.cle_titulaire_amm = :id', { id })
        .getMany();

      const produitPlusVendu = await this.lignesCommandeVenteRepository
        .createQueryBuilder('lcv')
        .leftJoin('lcv.produit', 'produit')
        .select('produit.produit', 'nom')
        .addSelect('SUM(lcv.quantite)', 'totalQuantite')
        .where('produit.cle_titulaire_amm = :id', { id })
        .groupBy('produit.id_produit')
        .orderBy('totalQuantite', 'DESC')
        .limit(1)
        .getRawOne();

      const ventesParMois = await this.lignesCommandeVenteRepository
        .createQueryBuilder('lcv')
        .leftJoin('lcv.produit', 'produit')
        .select("DATE_FORMAT(lcv.date, '%Y-%m')", 'mois') // Changé cv.created_at à lcv.date
        .addSelect('SUM(lcv.montant)', 'totalMontant')
        .where('produit.cle_titulaire_amm = :id', { id })
        .groupBy('mois')
        .orderBy('mois', 'ASC')
        .getRawMany();

      return {
        titulaire,
        produits,
        stats: {
          produitPlusVendu: produitPlusVendu ? produitPlusVendu.nom : 'Aucun',
          ventesParMois,
        },
      };
    } catch (error) {
      console.error('findOne failed:', error);
      throw new InternalServerErrorException(
        `Failed to find titulaire AMM: ${error.message}`,
      );
    }
  }
  async findInvoicesByTitulaire(id: number): Promise<any[]> {
    try {
      const titulaire = await this.titulaireAmmRepository.findOne({
        where: { id_titulaire_amm: id },
      });
      if (!titulaire) {
        throw new NotFoundException(`Titulaire AMM with ID ${id} not found`);
      }

      const invoices = await this.commandeVenteRepository
        .createQueryBuilder('cv')
        .leftJoinAndSelect('cv.lignes', 'lcv')
        .leftJoinAndSelect('lcv.produit', 'produit')
        .where('produit.cle_titulaire_amm = :id', { id })
        .select([
          'cv.id_commande_vente',
          'lcv.date',
          'lcv.id_ligne_commande_vente',
          'lcv.quantite',
          'lcv.prix_vente',
          'lcv.montant as ligne_montant',
          'produit.id_produit',
          'produit.produit',
          'SUM(lcv.montant) as total_montant',
        ])
        .groupBy('cv.id_commande_vente')
        .addGroupBy('lcv.id_ligne_commande_vente')
        .getRawMany();

      // Regrouper par commande pour structurer les factures
      const groupedInvoices = invoices.reduce((acc, row) => {
        const invoiceId = row.cv_id_commande_vente;
        if (!acc[invoiceId]) {
          acc[invoiceId] = {
            id_commande_vente: invoiceId,
            date: row.lcv_date,
            montant: row.total_montant,
            produits: [],
          };
        }
        acc[invoiceId].produits.push({
          id_produit: row.produit_id_produit,
          produit: row.produit_produit,
          quantite: row.lcv_quantite,
          prix_vente: row.lcv_prix_vente,
          montant: row.ligne_montant,
        });
        return acc;
      }, {});

      return Object.values(groupedInvoices);
    } catch (error) {
      console.error('findInvoicesByTitulaire failed:', error);
      throw new InternalServerErrorException(
        `Failed to find invoices for titulaire AMM: ${error.message}`,
      );
    }
  }

  async exportToExcel(res: Response): Promise<void> {
    console.log('exportToExcel called');
    try {
      const titulaires = await this.findAll();
      console.log('Excel data to write:', JSON.stringify(titulaires, null, 2));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Titulaires AMM', {
        properties: { tabColor: { argb: 'FF4CAF50' } },
      });

      worksheet.columns = [
        { header: 'Titulaire AMM', key: 'titulaire_amm', width: 35 },
      ];

      worksheet.mergeCells('A1:A1');
      worksheet.getCell('A1').value = 'Liste des Titulaires AMM';
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      worksheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0F7FA' },
      };

      worksheet.getRow(2).values = ['Titulaire AMM'];

      worksheet.getRow(2).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1976D2' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      titulaires.forEach((titulaire) => {
        worksheet.addRow({
          titulaire_amm: titulaire.titulaire_amm || '',
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          });
        }
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=titulaires_amm.xlsx',
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Export query failed:', error);
      throw new InternalServerErrorException(
        `Failed to execute export query: ${error.message}`,
      );
    }
  }

  async create(dto: CreateTitulaireAmmDto): Promise<TitulaireAmm> {
    const entity = this.titulaireAmmRepository.create(dto);
    return this.titulaireAmmRepository.save(entity);
  }

  async update(id: number, dto: UpdateTitulaireAmmDto): Promise<TitulaireAmm> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.titulaireAmmRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.titulaireAmmRepository.remove(entity);
  }
}
