import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { Produit } from '../produit/produit.entity';
import { TitulaireAmm } from '../titulaire_amm/titulaire_amm.entity';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,

    @InjectRepository(CommandeVente)
    private commandeVenteRepository: Repository<CommandeVente>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(TitulaireAmm)
    private titulaireAmmRepository: Repository<TitulaireAmm>,
    @InjectRepository(LignesCommandeVente)
    private lignesCommandeVenteRepository: Repository<LignesCommandeVente>,
  ) {}

  async findAll(searchTerm?: string): Promise<Client[]> {
    console.log('findAll called with:', { searchTerm });
    const queryBuilder = this.clientRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.statut', 'statut');

    if (searchTerm) {
      queryBuilder.where('c.nom LIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`,
      });
    }

    console.log(
      'Executing findAll query:',
      queryBuilder.getQueryAndParameters(),
    );
    try {
      const results = await queryBuilder.getMany();
      console.log('Clients data:', JSON.stringify(results, null, 2));
      return results;
    } catch (error) {
      console.error('findAll query failed:', JSON.stringify(error, null, 2));
      throw new InternalServerErrorException(
        `Failed to execute findAll query: ${error.message}`,
      );
    }
  }

  // async findAll(searchTerm?: string): Promise<Client[]> {
  //   console.log('findAll called with:', { searchTerm });
  //   const queryBuilder = this.clientRepository.createQueryBuilder('c');
  //   if (searchTerm) {
  //     queryBuilder.where('c.nom LIKE :searchTerm', {
  //       searchTerm: `%${searchTerm}%`,
  //     });
  //   }
  //   console.log(
  //     'Executing findAll query:',
  //     queryBuilder.getQueryAndParameters(),
  //   );
  //   try {
  //     const results = await queryBuilder.getMany();
  //     console.log('Clients data:', results);
  //     return results;
  //   } catch (error) {
  //     console.error('findAll query failed:', error);
  //     throw new InternalServerErrorException(
  //       `Failed to execute findAll query: ${error.message}`,
  //     );
  //   }
  // }

  async exportToExcel(res: Response): Promise<void> {
    console.log('exportToExcel called');
    try {
      const clients = await this.findAll();

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clients', {
        properties: { tabColor: { argb: 'FF4CAF50' } },
      });

      worksheet.columns = [
        { header: 'Nom', key: 'nom', width: 30 },
        { header: 'Adresse', key: 'adresse', width: 30 },
        { header: 'Numéro de téléphone', key: 'telephone', width: 20 },
      ];

      worksheet.mergeCells('A1:E1');
      worksheet.getCell('A1').value = 'Liste des Clients';
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

      worksheet.getRow(2).values = ['Nom', 'Adresse', 'Numéro de téléphone'];

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

      clients.forEach((client) => {
        worksheet.addRow({
          nom: client.nom || '',
          adresse: client.adresse || '',
          telephone: client.telephone || '',
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
      res.setHeader('Content-Disposition', 'attachment; filename=clients.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Export query failed:', error);
      throw new InternalServerErrorException(
        `Failed to execute export query: ${error.message}`,
      );
    }
  }

  async findOne(id: number): Promise<any> {
    try {
      const client = await this.clientRepository.findOne({
        where: { id_client: id },
      });
      if (!client) {
        throw new NotFoundException(`Client with ID ${id} not found`);
      }

      const commandes = await this.commandeVenteRepository
        .createQueryBuilder('cv')
        .leftJoinAndSelect('cv.lignes', 'lignes')
        .leftJoinAndSelect('lignes.produit', 'produit')
        .where('cv.id_client = :id', { id })
        .getMany();

      console.log('Commandes loaded:', JSON.stringify(commandes, null, 2));

      const totalRegle = commandes
        .filter((c) => c.statut === 1) // 1 = Réglé
        .reduce((sum, c) => sum + (c.montant_total || 0), 0);
      const totalEnAttente = commandes
        .filter((c) => c.statut === 0) // 0 = En attente
        .reduce((sum, c) => sum + (c.montant_total || 0), 0);

      const produitPlusAchete = await this.lignesCommandeVenteRepository
        .createQueryBuilder('lcv')
        .leftJoin('lcv.produit', 'produit')
        .leftJoin('lcv.commandeVente', 'cv')
        .select('produit.produit', 'nom')
        .addSelect('SUM(lcv.quantite)', 'totalQuantite')
        .where('cv.id_client = :id', { id })
        .groupBy('produit.id_produit')
        .orderBy('totalQuantite', 'DESC')
        .limit(1)
        .getRawOne();

      console.log('Produit plus acheté:', produitPlusAchete);

      const ventesParMois = await this.commandeVenteRepository
        .createQueryBuilder('cv')
        .select("DATE_FORMAT(cv.date_commande_vente, '%Y-%m')", 'mois')
        .addSelect('SUM(cv.montant_total)', 'totalMontant')
        .where('cv.id_client = :id', { id })
        .groupBy('mois')
        .orderBy('mois', 'ASC')
        .getRawMany();

      return {
        client,
        commandes,
        stats: {
          totalRegle,
          totalEnAttente,
          produitPlusAchete: produitPlusAchete
            ? produitPlusAchete.nom
            : 'Aucun',
          ventesParMois,
        },
      };
    } catch (error) {
      console.error('findOne failed:', error);
      throw new InternalServerErrorException(
        `Failed to find client: ${error.message}`,
      );
    }
  }
  // async findOne(id: number): Promise<Client> {
  //   const entity = await this.clientRepository.findOne({
  //     where: { id_client: id },
  //   });
  //   if (!entity) throw new NotFoundException('Client not found');
  //   return entity;
  // }

  async create(dto: CreateClientDto): Promise<Client> {
    const entity = this.clientRepository.create(dto);
    return this.clientRepository.save(entity);
  }

  async update(id: number, dto: UpdateClientDto): Promise<Client> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.clientRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.clientRepository.delete(entity);
  }
}
