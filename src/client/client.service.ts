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

  async findAllWithDetails(): Promise<any[]> {
    console.log('findAllWithDetails called');
    try {
      // Étape 1 : Récupérer tous les clients
      const clients = await this.clientRepository
        .createQueryBuilder('client')
        .leftJoinAndSelect('client.statut', 'statut')
        .select([
          'client.id_client',
          'client.nom',
          'client.prenom',
          'client.adresse',
          'client.telephone',
          'client.ville',
          'client.email',
          'client.nif',
          'client.avance',
          'statut.statut AS statut_statut',
        ])
        .getRawMany();

      console.log('Raw clients data:', JSON.stringify(clients, null, 2));

      // Étape 2 : Récupérer toutes les commandes validées
      const commandes = await this.commandeVenteRepository.find({
        where: { validee: 1 },
        relations: ['client', 'reglements'],
        order: { date_commande_vente: 'DESC' },
      });

      console.log('Commandes validées:', JSON.stringify(commandes, null, 2));

      // Étape 3 : Construire le résultat avec application de l'avance
      const result = clients.map((client) => {
        const clientCommandes = commandes.filter(
          (cmd) => cmd.id_client === client.client_id_client,
        );

        // Calculer les montants initiaux
        let montantTotal = clientCommandes.reduce(
          (sum, cmd) => sum + (cmd.montant_total || 0),
          0,
        );
        let montantPaye = clientCommandes.reduce(
          (sum, cmd) =>
            sum +
            (cmd.reglements || []).reduce(
              (regSum, reg) => regSum + (reg.montant || 0),
              0,
            ),
          0,
        );

        // Appliquer l'avance aux factures non réglées
        let remainingAdvance = client.client_avance || 0;
        const updatedCommandes = clientCommandes.map((cmd) => {
          let cmdMontantPaye = (cmd.reglements || []).reduce(
            (sum, reg) => sum + (reg.montant || 0),
            0,
          );
          let cmdMontantRestant = cmd.montant_total - cmdMontantPaye;

          // Appliquer l'avance si montant restant > 0 et avance disponible
          if (cmdMontantRestant > 0 && remainingAdvance > 0) {
            const amountToApply = Math.min(cmdMontantRestant, remainingAdvance);
            cmdMontantPaye += amountToApply;
            cmdMontantRestant -= amountToApply;
            remainingAdvance -= amountToApply;
          }

          // Considérer la facture comme réglée si le solde restant est inférieur à 10 (tolérance)
          const isReglee = Math.abs(cmdMontantRestant) <= 10 ? 1 : 0;

          return {
            id_commande_vente: cmd.id_commande_vente,
            numero_facture_certifiee: cmd.numero_facture_certifiee,
            numero_seq: cmd.numero_seq,
            date_commande_vente: cmd.date_commande_vente,
            montant_total: cmd.montant_total,
            montant_paye: parseFloat(cmdMontantPaye.toFixed(2)),
            montant_restant: parseFloat(cmdMontantRestant.toFixed(2)),
            reglee: isReglee,
            type_reglement: cmd.type_reglement,
            reglements: (cmd.reglements || []).map((reg) => ({
              id_reglement: reg.id_reglement,
              montant: reg.montant,
              date: reg.date,
            })),
          };
        });

        // Recalculer les montants totaux après application de l'avance
        montantPaye = updatedCommandes.reduce(
          (sum, cmd) => sum + cmd.montant_paye,
          0,
        );
        const montantRestant = montantTotal - montantPaye;

        // Log des commandes mises à jour pour ce client
        console.log(
          `Client ${client.client_id_client} - Commandes mises à jour:`,
          JSON.stringify(
            updatedCommandes.map((cmd) => ({
              id_commande_vente: cmd.id_commande_vente,
              montant_total: cmd.montant_total,
              montant_paye: cmd.montant_paye,
              montant_restant: cmd.montant_restant,
              reglee: cmd.reglee,
              reglements: cmd.reglements,
            })),
            null,
            2,
          ),
          `Total: ${montantTotal}, Payé: ${montantPaye}, Restant: ${montantRestant}, Avance restante: ${remainingAdvance}`,
        );

        return {
          id_client: client.client_id_client,
          nom: client.client_nom,
          prenom: client.client_prenom,
          adresse: client.client_adresse,
          telephone: client.client_telephone,
          ville: client.client_ville,
          email: client.client_email,
          nif: client.client_nif,
          avance: parseFloat(remainingAdvance.toFixed(2)),
          statut: client.statut_statut || 'N/A',
          montantTotal: parseFloat(montantTotal.toFixed(2)),
          montantPaye: parseFloat(montantPaye.toFixed(2)),
          montantRestant: parseFloat(montantRestant.toFixed(2)),
          commandes: updatedCommandes,
        };
      });

      console.log('Clients with details:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error(
        'findAllWithDetails query failed:',
        JSON.stringify(error, null, 2),
      );
      throw new InternalServerErrorException(
        `Failed to execute findAllWithDetails query: ${error.message}`,
      );
    }
  }
  // async findAllWithDetails(): Promise<any[]> {
  //   console.log('findAllWithDetails called');
  //   try {
  //     // Étape 1 : Récupérer tous les clients
  //     const clients = await this.clientRepository
  //       .createQueryBuilder('client')
  //       .leftJoinAndSelect('client.statut', 'statut')
  //       .select([
  //         'client.id_client',
  //         'client.nom',
  //         'client.prenom',
  //         'client.adresse',
  //         'client.telephone',
  //         'client.ville',
  //         'client.email',
  //         'client.nif',
  //         'client.avance',
  //         'statut.statut AS statut_statut',
  //       ])
  //       .getRawMany();

  //     console.log('Raw clients data:', JSON.stringify(clients, null, 2));

  //     // Étape 2 : Récupérer toutes les commandes validées
  //     const commandes = await this.commandeVenteRepository.find({
  //       where: { validee: 1 },
  //       relations: ['client', 'reglements'],
  //       order: { date_commande_vente: 'DESC' },
  //     });

  //     console.log('Commandes validées:', JSON.stringify(commandes, null, 2));

  //     // Étape 3 : Construire le résultat en imitant findHistoriqueByClient
  //     const result = clients.map((client) => {
  //       const clientCommandes = commandes.filter(
  //         (cmd) => cmd.id_client === client.client_id_client,
  //       );

  //       // Calculer les montants
  //       const montantTotal = clientCommandes.reduce(
  //         (sum, cmd) => sum + (cmd.montant_total || 0),
  //         0,
  //       );
  //       const montantPaye = clientCommandes.reduce(
  //         (sum, cmd) =>
  //           sum +
  //           (cmd.reglements || []).reduce(
  //             (regSum, reg) => regSum + (reg.montant || 0),
  //             0,
  //           ),
  //         0,
  //       );
  //       const montantRestant = montantTotal - montantPaye;

  //       // Log des commandes incluses pour ce client
  //       console.log(
  //         `Client ${client.client_id_client} - Commandes incluses:`,
  //         JSON.stringify(
  //           clientCommandes.map((cmd) => ({
  //             id_commande_vente: cmd.id_commande_vente,
  //             montant_total: cmd.montant_total,
  //             reglements: (cmd.reglements || []).map((reg) => ({
  //               id_reglement: reg.id_reglement,
  //               montant: reg.montant,
  //             })),
  //           })),
  //           null,
  //           2,
  //         ),
  //         `Total: ${montantTotal}, Payé: ${montantPaye}, Restant: ${montantRestant}`,
  //       );

  //       return {
  //         id_client: client.client_id_client,
  //         nom: client.client_nom,
  //         prenom: client.client_prenom,
  //         adresse: client.client_adresse,
  //         telephone: client.client_telephone,
  //         ville: client.client_ville,
  //         email: client.client_email,
  //         nif: client.client_nif,
  //         avance: client.client_avance,
  //         statut: client.statut_statut || 'N/A',
  //         montantTotal: parseFloat(montantTotal.toFixed(2)),
  //         montantPaye: parseFloat(montantPaye.toFixed(2)),
  //         montantRestant: parseFloat(montantRestant.toFixed(2)),
  //         commandes: clientCommandes.map((cmd) => ({
  //           id_commande_vente: cmd.id_commande_vente,
  //           numero_facture_certifiee: cmd.numero_facture_certifiee,
  //           numero_seq: cmd.numero_seq,
  //           date_commande_vente: cmd.date_commande_vente,
  //           montant_total: cmd.montant_total,
  //           montant_paye: (cmd.reglements || []).reduce(
  //             (sum, reg) => sum + (reg.montant || 0),
  //             0,
  //           ),
  //           montant_restant:
  //             cmd.montant_total -
  //             (cmd.reglements || []).reduce(
  //               (sum, reg) => sum + (reg.montant || 0),
  //               0,
  //             ),
  //           reglee:
  //             cmd.montant_total -
  //               (cmd.reglements || []).reduce(
  //                 (sum, reg) => sum + (reg.montant || 0),
  //                 0,
  //               ) <=
  //             0
  //               ? 1
  //               : 0,
  //           type_reglement: cmd.type_reglement,
  //           reglements: (cmd.reglements || []).map((reg) => ({
  //             id_reglement: reg.id_reglement,
  //             montant: reg.montant,
  //             date: reg.date,
  //           })),
  //         })),
  //       };
  //     });

  //     console.log('Clients with details:', JSON.stringify(result, null, 2));
  //     return result;
  //   } catch (error) {
  //     console.error(
  //       'findAllWithDetails query failed:',
  //       JSON.stringify(error, null, 2),
  //     );
  //     throw new InternalServerErrorException(
  //       `Failed to execute findAllWithDetails query: ${error.message}`,
  //     );
  //   }
  // }

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
