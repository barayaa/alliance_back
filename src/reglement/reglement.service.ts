import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Reglement } from './reglement.entity';
import { CreateReglementDto } from './dto/create-reglement.dto';
import { UpdateReglementDto } from './dto/update-reglement.dto';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { Client } from '../client/client.entity';
import { Caisse } from 'src/caisse/entities/caisse.entity';
import { Compte } from 'src/comptes/entities/compte.entity';
import { TypeReglement } from 'src/type_reglement/type_reglement.entity';
// import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import { MouvementCaisse } from 'src/mouvement_caisse/entities/mouvement_caisse.entity';
import { MouvementCompte } from 'src/mouvement_compte/entities/mouvement_compte.entity';
const PDFDocument = require('pdfkit');

export interface PaymentDistributionResult {
  facturesAffectees: {
    id_commande_vente: string;
    montant_total: number;
    montant_paye_avant: number;
    montant_paye_actuel: number;
    montant_restant: number;
    reglee: boolean;
  }[];
  avance: number;
  montantRestant: number;
}

@Injectable()
export class ReglementService {
  constructor(
    @InjectRepository(Reglement)
    private reglementRepository: Repository<Reglement>,

    @InjectRepository(CommandeVente)
    private commandeVenteRepository: Repository<CommandeVente>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,

    @InjectRepository(Caisse)
    private caisseRepository: Repository<Caisse>,
    @InjectRepository(Compte)
    private compteRepository: Repository<Compte>,
    @InjectRepository(TypeReglement)
    private typeReglementRepository: Repository<TypeReglement>,
    private dataSource: DataSource,
  ) {}

  async findAll(
    id_client?: number,
    id_commande_vente?: string,
  ): Promise<Reglement[]> {
    const where: any = {};
    if (id_client) where.id_client = id_client;
    if (id_commande_vente) where.id_commande_vente = id_commande_vente;

    try {
      const reglements = await this.reglementRepository.find({
        where,
        relations: ['commandeVente', 'commandeVente.client'],
        order: { date: 'DESC' },
      });
      console.log('Règlements trouvés:', JSON.stringify(reglements, null, 2));
      return reglements;
    } catch (error) {
      console.error('Erreur lors de la récupération des règlements:', error);
      throw new BadRequestException(
        'Erreur lors de la récupération des règlements',
      );
    }
  }

  async findOne(id: number): Promise<Reglement> {
    try {
      const entity = await this.reglementRepository.findOne({
        where: { id_reglement: id },
        relations: ['commandeVente', 'commandeVente.client'],
      });
      if (!entity)
        throw new NotFoundException(`Règlement avec l'ID ${id} non trouvé`);
      return entity;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du règlement ${id}:`,
        error,
      );
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            'Erreur lors de la récupération du règlement',
          );
    }
  }
  async findHistoriqueByClient(
    id_client: number,
    dateDebut?: string,
    dateFin?: string,
  ): Promise<any> {
    try {
      const client = await this.clientRepository.findOne({
        where: { id_client },
      });
      if (!client)
        throw new NotFoundException(`Client avec l'ID ${id_client} non trouvé`);

      // Validate date format
      if (dateDebut && !/^\d{4}-\d{2}-\d{2}$/.test(dateDebut)) {
        throw new BadRequestException(
          'Format de dateDebut invalide (YYYY-MM-DD attendu)',
        );
      }
      if (dateFin && !/^\d{4}-\d{2}-\d{2}$/.test(dateFin)) {
        throw new BadRequestException(
          'Format de dateFin invalide (YYYY-MM-DD attendu)',
        );
      }

      // Fetch commandes for the client
      const commandes = await this.commandeVenteRepository.find({
        where: { id_client },
        relations: ['client', 'reglements'],
        order: { date_commande_vente: 'DESC' },
      });

      // Filter règlements by date range and map to historique
      const historique = commandes
        .map((commande) => {
          const filteredReglements = (commande.reglements || []).filter(
            (reglement) => {
              if (!dateDebut && !dateFin) return true; // No date filter
              if (dateDebut && !dateFin) return reglement.date >= dateDebut;
              if (!dateDebut && dateFin) return reglement.date <= dateFin;
              return reglement.date >= dateDebut && reglement.date <= dateFin;
            },
          );

          // Only include commandes with matching règlements
          if (filteredReglements.length === 0 && (dateDebut || dateFin)) {
            return null;
          }

          return {
            facture: {
              id_commande_vente: commande.id_commande_vente,
              numero_facture_certifiee: commande.numero_facture_certifiee,
              numero_seq: commande.numero_seq,
              date_commande_vente: commande.date_commande_vente,
              montant_total: commande.montant_total,
              montant_paye: filteredReglements.reduce(
                (sum, reg) => sum + reg.montant,
                0,
              ),
              montant_restant:
                commande.montant_total -
                filteredReglements.reduce((sum, reg) => sum + reg.montant, 0),
              reglee:
                commande.montant_total -
                  filteredReglements.reduce(
                    (sum, reg) => sum + reg.montant,
                    0,
                  ) <=
                0
                  ? 1
                  : 0,
              type_reglement: commande.type_reglement,
            },
            reglements: filteredReglements.map((reglement) => ({
              id_reglement: reglement.id_reglement,
              montant: reglement.montant,
              date: reglement.date,
              // mode_paiement:
              //   reglement.mode_paiement || commande.type_reglement || 'N/A',
              // reference: reglement.reference || reglement.id_reglement,
            })),
          };
        })
        .filter((item) => item !== null); // Remove commandes with no matching règlements

      console.log(
        `Historique du client ${id_client}:`,
        JSON.stringify(historique, null, 2),
      );
      return historique;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération de l'historique du client ${id_client}:`,
        error,
      );
      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(
            "Erreur lors de la récupération de l'historique des règlements",
          );
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const entity = await this.findOne(id);
      await this.reglementRepository.remove(entity);
      console.log(`Règlement ${id} supprimé`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du règlement ${id}:`, error);
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException('Erreur lors de la suppression du règlement');
    }
  }

  // async createReglement(
  //   createReglementDto: CreateReglementDto,
  // ): Promise<PaymentDistributionResult & { receipt: Buffer }> {
  //   const {
  //     id_client,
  //     montant,
  //     date,
  //     id_type_reglement,
  //     id_caisse,
  //     id_compte,
  //     id_commandes_vente,
  //   } = createReglementDto;

  //   if (!id_client || montant <= 0 || !date || !id_type_reglement) {
  //     throw new BadRequestException(
  //       'id_client, montant positif, date et id_type_reglement sont requis',
  //     );
  //   }

  //   const client = await this.clientRepository.findOne({
  //     where: { id_client },
  //   });
  //   if (!client) {
  //     throw new NotFoundException(`Client avec l'ID ${id_client} non trouvé`);
  //   }

  //   const typeReglement = await this.typeReglementRepository.findOne({
  //     where: { id_type_reglement },
  //   });
  //   if (!typeReglement) {
  //     throw new NotFoundException(
  //       `Type de règlement avec l'ID ${id_type_reglement} non trouvé`,
  //     );
  //   }

  //   if (typeReglement.type_reglement === 'E' && !id_caisse) {
  //     throw new BadRequestException(
  //       'id_caisse est requis pour un règlement en espèces',
  //     );
  //   }
  //   if (['D', 'V'].includes(typeReglement.type_reglement) && !id_compte) {
  //     throw new BadRequestException(
  //       'id_compte est requis pour un règlement par chèque ou virement',
  //     );
  //   }

  //   let caisse: Caisse | null = null;
  //   let compte: Compte | null = null;

  //   if (id_caisse) {
  //     caisse = await this.caisseRepository.findOne({ where: { id_caisse } });
  //     if (!caisse) {
  //       throw new NotFoundException(
  //         `Caisse avec l'ID ${id_caisse} non trouvée`,
  //       );
  //     }
  //   }
  //   if (id_compte) {
  //     compte = await this.compteRepository.findOne({ where: { id_compte } });
  //     if (!compte) {
  //       throw new NotFoundException(`Compte avec l'ID ${id_compte} non trouvé`);
  //     }
  //   }

  //   // CORRECTION: Récupérer TOUTES les factures du client, pas seulement les non réglées
  //   const factures = await this.commandeVenteRepository
  //     .createQueryBuilder('commande')
  //     .where('commande.id_client = :id_client', { id_client })
  //     .orderBy('commande.date_commande_vente', 'ASC')
  //     .getMany();

  //   console.log(
  //     `Factures récupérées pour le client ${id_client}: ${factures.length}`,
  //   );

  //   // Amélioration de la validation des factures spécifiées
  //   let prioritizedFactures = [...factures];
  //   if (id_commandes_vente && id_commandes_vente.length > 0) {
  //     console.log('Factures demandées:', id_commandes_vente);
  //     console.log(
  //       'Factures disponibles:',
  //       factures.map((f) => ({
  //         id: f.id_commande_vente.toString(),
  //         reglee: f.reglee,
  //         montant_restant: f.montant_restant,
  //         montant_total: f.montant_total,
  //         montant_paye: f.montant_paye || 0,
  //       })),
  //     );

  //     // Vérifier d'abord si les factures existent AVANT de filtrer par statut
  //     const facturesExistantes = factures.filter((f) =>
  //       id_commandes_vente.includes(f.id_commande_vente.toString()),
  //     );

  //     if (facturesExistantes.length === 0) {
  //       throw new BadRequestException(
  //         `Aucune des factures spécifiées (${id_commandes_vente.join(', ')}) n'existe pour ce client`,
  //       );
  //     }

  //     // Identifier les factures qui n'existent pas
  //     const missingIds = id_commandes_vente.filter(
  //       (id) => !factures.some((f) => f.id_commande_vente.toString() === id),
  //     );

  //     if (missingIds.length > 0) {
  //       throw new BadRequestException(
  //         `Les factures suivantes n'existent pas pour ce client: ${missingIds.join(', ')}`,
  //       );
  //     }

  //     // Ne filtrer que les factures qui PEUVENT recevoir un paiement
  //     const facturesValides = facturesExistantes.filter((f) => {
  //       const montantDu = f.montant_total - (f.montant_paye || 0);
  //       return montantDu > 0; // Seules les factures avec un montant dû > 0 peuvent recevoir un paiement
  //     });

  //     if (facturesValides.length === 0) {
  //       const facturesReglees = facturesExistantes.filter((f) => {
  //         const montantDu = f.montant_total - (f.montant_paye || 0);
  //         return montantDu <= 0;
  //       });

  //       throw new BadRequestException(
  //         `Toutes les factures spécifiées sont déjà entièrement réglées: ${facturesReglees.map((f) => f.id_commande_vente).join(', ')}`,
  //       );
  //     }

  //     // Identifier les factures spécifiées qui sont déjà réglées (pour information)
  //     const facturesDejaReglees = facturesExistantes.filter((f) => {
  //       const montantDu = f.montant_total - (f.montant_paye || 0);
  //       return montantDu <= 0;
  //     });

  //     if (facturesDejaReglees.length > 0) {
  //       console.log(
  //         `Avertissement: Ces factures sont déjà réglées et seront ignorées: ${facturesDejaReglees.map((f) => f.id_commande_vente).join(', ')}`,
  //       );
  //     }

  //     // Utiliser seulement les factures valides pour le règlement
  //     prioritizedFactures = [
  //       ...facturesValides.sort(
  //         (a, b) =>
  //           id_commandes_vente.indexOf(a.id_commande_vente.toString()) -
  //           id_commandes_vente.indexOf(b.id_commande_vente.toString()),
  //       ),
  //       // Ajouter les autres factures non réglées du client (non spécifiées)
  //       ...factures.filter((f) => {
  //         const nonSpecifiee = !id_commandes_vente.includes(
  //           f.id_commande_vente.toString(),
  //         );
  //         const montantDu = f.montant_total - (f.montant_paye || 0);
  //         return nonSpecifiee && montantDu > 0;
  //       }),
  //     ];

  //     console.log(
  //       `Factures valides pour règlement: ${facturesValides.map((f) => f.id_commande_vente).join(', ')}`,
  //     );
  //   } else {
  //     // Si aucune facture spécifiée, utiliser seulement les factures avec un solde dû
  //     prioritizedFactures = factures.filter((f) => {
  //       const montantDu = f.montant_total - (f.montant_paye || 0);
  //       return montantDu > 0;
  //     });
  //   }

  //   // Vérifier qu'il y a au moins une facture à traiter
  //   if (prioritizedFactures.length === 0) {
  //     throw new BadRequestException(
  //       'Aucune facture disponible pour ce règlement. Toutes les factures du client sont déjà entièrement réglées.',
  //     );
  //   }

  //   console.log(
  //     `Factures ${id_commandes_vente ? id_commandes_vente.join(', ') + ' ' : ''}priorisées pour le règlement.`,
  //   );

  //   let montantRestant = montant;
  //   const facturesAffectees: PaymentDistributionResult['facturesAffectees'] =
  //     [];
  //   const reglementsToSave: Reglement[] = [];

  //   let montantAppliqueAuxFactures = 0;
  //   for (const facture of prioritizedFactures) {
  //     if (montantRestant <= 0) break;

  //     const montantDu = facture.montant_total - (facture.montant_paye || 0);
  //     if (montantDu <= 0) {
  //       console.log(
  //         `Facture ${facture.id_commande_vente} déjà réglée, ignorée`,
  //       );
  //       continue;
  //     }

  //     const montantAffecte = Math.min(montantRestant, montantDu);
  //     montantRestant -= montantAffecte;
  //     montantAppliqueAuxFactures += montantAffecte;

  //     facture.montant_paye = (facture.montant_paye || 0) + montantAffecte;
  //     facture.montant_restant = facture.montant_total - facture.montant_paye;
  //     facture.reglee = facture.montant_restant <= 0 ? 1 : 0;

  //     const reglement = new Reglement();
  //     reglement.id_client = id_client;
  //     reglement.client = client;
  //     reglement.montant = montantAffecte;
  //     reglement.date = date;
  //     reglement.id_commande_vente = facture.id_commande_vente.toString();
  //     reglement.commandeVente = facture;
  //     reglement.id_type_reglement = id_type_reglement;
  //     reglement.typeReglement = typeReglement;
  //     reglement.id_caisse = id_caisse || null;
  //     reglement.caisse = caisse || null;
  //     reglement.id_compte = id_compte || null;
  //     reglement.compte = compte || null;

  //     reglementsToSave.push(reglement);

  //     facturesAffectees.push({
  //       id_commande_vente: facture.id_commande_vente.toString(),
  //       montant_total: facture.montant_total,
  //       montant_paye_avant: (facture.montant_paye || 0) - montantAffecte,
  //       montant_paye_actuel: montantAffecte,
  //       montant_restant: facture.montant_restant,
  //       reglee: facture.reglee === 1,
  //     });

  //     console.log(
  //       `Facture ${facture.id_commande_vente} mise à jour: montant_paye=${facture.montant_paye}, montant_restant=${facture.montant_restant}`,
  //     );
  //   }

  //   client.solde = (client.solde || 0) - montantAppliqueAuxFactures;
  //   if (client.solde < 0) {
  //     client.solde = 0;
  //   }

  //   if (montantRestant > 0) {
  //     client.avance = (client.avance || 0) + montantRestant;
  //     console.log(
  //       `Avance mise à jour pour le client ${id_client}: ${client.avance}`,
  //     );
  //   }

  //   if (caisse) {
  //     caisse.solde = (caisse.solde || 0) + montant;
  //   }
  //   if (compte) {
  //     compte.solde = (compte.solde || 0) + montant;
  //   }

  //   try {
  //     await this.dataSource.transaction(async (transactionalEntityManager) => {
  //       if (caisse) {
  //         await transactionalEntityManager.save(Caisse, caisse);
  //       }
  //       if (compte) {
  //         await transactionalEntityManager.save(Compte, compte);
  //       }
  //       await transactionalEntityManager.save(Client, client);
  //       await transactionalEntityManager.save(
  //         CommandeVente,
  //         prioritizedFactures,
  //       );
  //       await transactionalEntityManager.save(Reglement, reglementsToSave);
  //     });

  //     // Générer le reçu de paiement
  //     const receipt = await this.generatePaymentReceipt({
  //       client,
  //       facturesAffectees,
  //       montant,
  //       date,
  //       typeReglement,
  //       caisse,
  //       compte,
  //     });

  //     if (caisse) {
  //       console.log(
  //         `Solde de la caisse ${id_caisse} mis à jour: ${caisse.solde}`,
  //       );
  //     }
  //     if (compte) {
  //       console.log(`Solde du compte ${id_compte} mis à jour: ${compte.solde}`);
  //     }
  //     console.log(
  //       `Client ${id_client} mis à jour: solde=${client.solde}, avance=${client.avance}`,
  //     );
  //     console.log(
  //       'Règlements créés et factures mises à jour:',
  //       JSON.stringify(facturesAffectees, null, 2),
  //     );

  //     return {
  //       facturesAffectees,
  //       avance: client.avance,
  //       montantRestant,
  //       receipt, // Retourner le buffer du PDF
  //     };
  //   } catch (error) {
  //     console.error('Erreur lors de la création du règlement:', error);
  //     throw new BadRequestException('Erreur lors de la création du règlement');
  //   }
  // }

  private getTypeReglementLabel(type: string): string {
    const labels = {
      E: 'Espèces',
      D: 'Chèque',
      V: 'Virement',
      CB: 'Carte Bancaire',
    };
    return labels[type] || type;
  }

  private async generatePaymentReceipt(data: {
    client: Client;
    facturesAffectees: PaymentDistributionResult['facturesAffectees'];
    montant: number;
    date: string;
    typeReglement: TypeReglement;
    caisse: Caisse | null;
    compte: Compte | null;
  }): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ size: 'A4', margin: 40 });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Constantes
        const PAGE_WIDTH = 595.28;
        const MARGINS = 40;
        const HEADER_HEIGHT = 80;

        // === EN-TÊTE ===
        const headerTop = 40;
        const sectionWidth = (PAGE_WIDTH - 2 * MARGINS) / 3;

        // Section 1: Alliance Pharma
        doc
          .rect(MARGINS, headerTop, sectionWidth, HEADER_HEIGHT)
          .strokeColor('black')
          .stroke();
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('ALLIANCE PHARMA', MARGINS + 10, headerTop + 10, {
          width: sectionWidth - 20,
          align: 'center',
        });
        doc.fontSize(8).font('Helvetica');
        doc.text('Tel: 80130610', MARGINS + 10, headerTop + 25, {
          width: sectionWidth - 20,
          align: 'center',
        });
        doc.text(
          'RCCM: NE/NIM/01/2024/B14/00004',
          MARGINS + 10,
          headerTop + 35,
          { width: sectionWidth - 20, align: 'center' },
        );
        doc.text('NIF: 37364/R', MARGINS + 10, headerTop + 45, {
          width: sectionWidth - 20,
          align: 'center',
        });
        doc.text('BP: 11807', MARGINS + 10, headerTop + 55, {
          width: sectionWidth - 20,
          align: 'center',
        });
        doc.text('Adresse: NIAMEY', MARGINS + 10, headerTop + 65, {
          width: sectionWidth - 20,
          align: 'center',
        });

        // Section 2: Logo
        doc
          .rect(MARGINS + sectionWidth, headerTop, sectionWidth, HEADER_HEIGHT)
          .strokeColor('black')
          .stroke();
        try {
          doc.image(
            'src/uploads/rmlogo.png',
            MARGINS + sectionWidth + (sectionWidth - 90) / 2,
            headerTop + 10,
            { width: 90 },
          );
        } catch (error) {
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('LOGO', MARGINS + sectionWidth + 10, headerTop + 40, {
              width: sectionWidth - 20,
              align: 'center',
            });
        }

        // Section 3: REÇU DE PAIEMENT
        doc
          .rect(
            MARGINS + 2 * sectionWidth,
            headerTop,
            sectionWidth,
            HEADER_HEIGHT,
          )
          .strokeColor('black')
          .stroke();
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#009933');
        doc.text(
          'REÇU DE PAIEMENT',
          MARGINS + 2 * sectionWidth + 10,
          headerTop + 10,
          {
            width: sectionWidth - 20,
            align: 'center',
          },
        );
        doc.fillColor('black');

        const receiptNumber = `RCP-${Date.now()}`;
        doc.fontSize(8).font('Helvetica');
        doc.text(
          `N° ${receiptNumber}`,
          MARGINS + 2 * sectionWidth + 10,
          headerTop + 30,
          {
            width: sectionWidth - 20,
            align: 'center',
          },
        );
        doc.text(
          `Date: ${new Date(data.date).toLocaleDateString('fr-FR')}`,
          MARGINS + 2 * sectionWidth + 10,
          headerTop + 45,
          {
            width: sectionWidth - 20,
            align: 'center',
          },
        );

        // Séparateurs verticaux
        doc
          .moveTo(MARGINS + sectionWidth, headerTop)
          .lineTo(MARGINS + sectionWidth, headerTop + HEADER_HEIGHT)
          .stroke();
        doc
          .moveTo(MARGINS + 2 * sectionWidth, headerTop)
          .lineTo(MARGINS + 2 * sectionWidth, headerTop + HEADER_HEIGHT)
          .stroke();

        // Ligne de séparation
        const separatorY = headerTop + HEADER_HEIGHT + 10;
        doc
          .moveTo(MARGINS, separatorY)
          .lineTo(PAGE_WIDTH - MARGINS, separatorY)
          .stroke();

        // === INFORMATIONS CLIENT ===
        const infoTop = separatorY + 15;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('INFORMATIONS CLIENT', MARGINS, infoTop);

        doc.fontSize(8).font('Helvetica');
        const clientInfoTop = infoTop + 20;
        doc.text(
          `Client: ${this.sanitize(data.client.nom || 'N/A')}`,
          MARGINS,
          clientInfoTop,
        );
        doc.text(
          `NIF: ${this.sanitize(data.client.nif || 'N/A')}`,
          MARGINS,
          clientInfoTop + 12,
        );
        doc.text(
          `Adresse: ${this.sanitize(data.client.adresse || 'N/A')}`,
          MARGINS,
          clientInfoTop + 24,
        );
        doc.text(
          `Téléphone: ${this.sanitize(data.client.telephone || 'N/A')}`,
          MARGINS,
          clientInfoTop + 36,
        );

        // === DÉTAILS DU PAIEMENT ===
        const paymentInfoX = MARGINS + 300;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('DÉTAILS DU PAIEMENT', paymentInfoX, infoTop);

        doc.fontSize(8).font('Helvetica');
        doc.text(
          `Montant payé: ${this.formatCurrency(data.montant)} CFA`,
          paymentInfoX,
          clientInfoTop,
        );
        doc.text(
          `Mode: ${this.getTypeReglementLabel(data.typeReglement.type_reglement)}`,
          paymentInfoX,
          clientInfoTop + 12,
        );

        if (data.caisse) {
          doc.text(
            `Caisse: ${this.sanitize(data.caisse.nom || 'N/A')}`,
            paymentInfoX,
            clientInfoTop + 24,
          );
        }
        if (data.compte) {
          doc.text(
            `Compte: ${this.sanitize(data.compte.numero_compte || 'N/A')}`,
            paymentInfoX,
            clientInfoTop + 24,
          );
        }

        // === TABLEAU DES FACTURES RÉGLÉES ===
        const tableTop = clientInfoTop + 60;
        const tableLeft = MARGINS;
        const columnWidths = [100, 100, 100, 100, 110];

        // En-tête du tableau
        doc.fontSize(9).font('Helvetica-Bold');
        let x = tableLeft;
        const headers = [
          'N° Facture',
          'Montant Total',
          'Payé Avant',
          'Payé Maintenant',
          'Restant',
        ];

        headers.forEach((header, i) => {
          doc.text(header, x, tableTop, {
            width: columnWidths[i],
            align: 'center',
          });
          x += columnWidths[i];
        });

        doc
          .moveTo(tableLeft, tableTop + 20)
          .lineTo(
            tableLeft + columnWidths.reduce((a, b) => a + b, 0),
            tableTop + 20,
          )
          .stroke();

        // Lignes du tableau
        let y = tableTop + 25;
        doc.fontSize(8).font('Helvetica');

        data.facturesAffectees.forEach((facture, index) => {
          if (y > 700) {
            doc.addPage();
            y = 40;
          }

          x = tableLeft;

          // Bordure verticale de début
          doc
            .moveTo(tableLeft, y)
            .lineTo(tableLeft, y + 20)
            .stroke();

          // N° Facture
          doc.text(facture.id_commande_vente, x + 5, y + 5, {
            width: columnWidths[0] - 10,
            align: 'center',
          });
          x += columnWidths[0];
          doc
            .moveTo(x, y)
            .lineTo(x, y + 20)
            .stroke();

          // Montant Total
          doc.text(this.formatCurrency(facture.montant_total), x + 5, y + 5, {
            width: columnWidths[1] - 10,
            align: 'right',
          });
          x += columnWidths[1];
          doc
            .moveTo(x, y)
            .lineTo(x, y + 20)
            .stroke();

          // Payé Avant
          doc.text(
            this.formatCurrency(facture.montant_paye_avant),
            x + 5,
            y + 5,
            { width: columnWidths[2] - 10, align: 'right' },
          );
          x += columnWidths[2];
          doc
            .moveTo(x, y)
            .lineTo(x, y + 20)
            .stroke();

          // Payé Maintenant (en gras vert)
          doc.font('Helvetica-Bold').fillColor('#009933');
          doc.text(
            this.formatCurrency(facture.montant_paye_actuel),
            x + 5,
            y + 5,
            { width: columnWidths[3] - 10, align: 'right' },
          );
          doc.font('Helvetica').fillColor('black');
          x += columnWidths[3];
          doc
            .moveTo(x, y)
            .lineTo(x, y + 20)
            .stroke();

          // Restant
          const color = facture.montant_restant <= 0 ? '#009933' : '#000000';
          doc.fillColor(color);
          doc.text(this.formatCurrency(facture.montant_restant), x + 5, y + 5, {
            width: columnWidths[4] - 10,
            align: 'right',
          });
          doc.fillColor('black');
          x += columnWidths[4];
          doc
            .moveTo(x, y)
            .lineTo(x, y + 20)
            .stroke();

          // Bordure horizontale
          doc
            .moveTo(tableLeft, y + 20)
            .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y + 20)
            .stroke();

          y += 20;
        });

        // === RÉSUMÉ ===
        const summaryTop = y + 30;
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#009933');
        doc.text('RÉSUMÉ DU PAIEMENT', MARGINS, summaryTop);
        doc.fillColor('black');

        doc
          .moveTo(MARGINS, summaryTop + 15)
          .lineTo(PAGE_WIDTH - MARGINS, summaryTop + 15)
          .stroke();

        let currentY = summaryTop + 25;
        doc.fontSize(9).font('Helvetica');

        // Montant total payé
        doc.text('Montant total payé:', MARGINS, currentY);
        doc.font('Helvetica-Bold').fillColor('#009933');
        doc.text(
          `${this.formatCurrency(data.montant)} CFA`,
          PAGE_WIDTH - MARGINS - 100,
          currentY,
          { align: 'right' },
        );
        doc.font('Helvetica').fillColor('black');
        currentY += 20;

        // Nombre de factures réglées
        const facturesComplete = data.facturesAffectees.filter(
          (f) => f.reglee,
        ).length;
        const facturesPartielles = data.facturesAffectees.filter(
          (f) => !f.reglee,
        ).length;

        doc.text(`Factures entièrement réglées:`, MARGINS, currentY);
        doc.text(`${facturesComplete}`, PAGE_WIDTH - MARGINS - 100, currentY, {
          align: 'right',
        });
        currentY += 15;

        doc.text(`Factures partiellement réglées:`, MARGINS, currentY);
        doc.text(
          `${facturesPartielles}`,
          PAGE_WIDTH - MARGINS - 100,
          currentY,
          { align: 'right' },
        );
        currentY += 25;

        // Ligne de séparation
        doc
          .moveTo(MARGINS, currentY)
          .lineTo(PAGE_WIDTH - MARGINS, currentY)
          .stroke();
        currentY += 15;

        // Conversion en lettres
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Arrêté le présent reçu à la somme de :', MARGINS, currentY);
        currentY += 15;
        doc.fontSize(9).font('Helvetica');
        doc.text(
          `${this.numberToWordsFr(Math.round(data.montant))} francs CFA`,
          MARGINS,
          currentY,
          {
            width: PAGE_WIDTH - 2 * MARGINS,
            align: 'center',
          },
        );
        currentY += 30;

        // === SIGNATURE ===
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Le Caissier', MARGINS, currentY, { underline: true });
        doc.text('Le Client', MARGINS + 300, currentY, { underline: true });

        // Lignes pour signatures
        currentY += 40;
        doc
          .moveTo(MARGINS, currentY)
          .lineTo(MARGINS + 150, currentY)
          .stroke();
        doc
          .moveTo(MARGINS + 300, currentY)
          .lineTo(MARGINS + 450, currentY)
          .stroke();

        // === PIED DE PAGE ===
        const footerY = 750;
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666');
        doc.text('Merci pour votre confiance', MARGINS, footerY, {
          width: PAGE_WIDTH - 2 * MARGINS,
          align: 'center',
        });
        doc.text('Ce reçu fait foi de paiement', MARGINS, footerY + 12, {
          width: PAGE_WIDTH - 2 * MARGINS,
          align: 'center',
        });
        doc.fillColor('black');

        // Ligne finale
        doc
          .moveTo(MARGINS, footerY - 10)
          .lineTo(PAGE_WIDTH - MARGINS, footerY - 10)
          .stroke();

        doc.end();
      } catch (error) {
        console.error('Erreur génération PDF reçu:', error);
        reject(error);
      }
    });
  }

  // Méthodes utilitaires
  private sanitize(str: string): string {
    if (!str) return 'N/A';
    return str.replace(/[^\x20-\x7E]/g, '').substring(0, 50);
  }

  private formatCurrency(amount: number): string {
    return Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // private getTypeReglementLabel(type: string): string {
  //   const labels: { [key: string]: string } = {
  //     E: 'Espèces',
  //     D: 'Chèque',
  //     V: 'Virement',
  //     C: 'Carte bancaire',
  //   };
  //   return labels[type] || type;
  // }

  private numberToWordsFr(num: number): string {
    if (num === 0) return 'zéro';

    const units = [
      '',
      'un',
      'deux',
      'trois',
      'quatre',
      'cinq',
      'six',
      'sept',
      'huit',
      'neuf',
    ];
    const teens = [
      'dix',
      'onze',
      'douze',
      'treize',
      'quatorze',
      'quinze',
      'seize',
      'dix-sept',
      'dix-huit',
      'dix-neuf',
    ];
    const tens = [
      '',
      '',
      'vingt',
      'trente',
      'quarante',
      'cinquante',
      'soixante',
      'soixante-dix',
      'quatre-vingt',
      'quatre-vingt-dix',
    ];

    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      if (unit === 0) return tens[ten];
      if (ten === 7 || ten === 9) {
        return tens[ten - 1] + '-' + teens[unit];
      }
      return tens[ten] + (unit === 1 && ten !== 8 ? '-et-' : '-') + units[unit];
    }

    // Pour les grands nombres, simplification
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      let result = hundred === 1 ? 'cent' : units[hundred] + ' cent';
      if (rest > 0) result += ' ' + this.numberToWordsFr(rest);
      return result;
    }

    const thousand = Math.floor(num / 1000);
    const rest = num % 1000;
    let result =
      thousand === 1 ? 'mille' : this.numberToWordsFr(thousand) + ' mille';
    if (rest > 0) result += ' ' + this.numberToWordsFr(rest);
    return result;
  }

  //reglemeent avec mouvement de caisse er compte

  async createReglement(
    createReglementDto: CreateReglementDto,
  ): Promise<PaymentDistributionResult & { receipt: Buffer }> {
    const {
      id_client,
      montant,
      date,
      id_type_reglement,
      id_caisse,
      id_compte,
      id_commandes_vente,
    } = createReglementDto;

    // Validations initiales
    if (!id_client || montant <= 0 || !date || !id_type_reglement) {
      throw new BadRequestException(
        'id_client, montant positif, date et id_type_reglement sont requis',
      );
    }

    // Vérifier le client
    const client = await this.clientRepository.findOne({
      where: { id_client },
    });
    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${id_client} non trouvé`);
    }

    // Vérifier le type de règlement
    const typeReglement = await this.typeReglementRepository.findOne({
      where: { id_type_reglement },
    });
    if (!typeReglement) {
      throw new NotFoundException(
        `Type de règlement avec l'ID ${id_type_reglement} non trouvé`,
      );
    }

    // Validation selon le type de règlement
    if (typeReglement.type_reglement === 'E' && !id_caisse) {
      throw new BadRequestException(
        'id_caisse est requis pour un règlement en espèces',
      );
    }
    if (['D', 'V'].includes(typeReglement.type_reglement) && !id_compte) {
      throw new BadRequestException(
        'id_compte est requis pour un règlement par chèque ou virement',
      );
    }

    // Récupérer caisse et compte si nécessaire
    let caisse: Caisse | null = null;
    let compte: Compte | null = null;

    if (id_caisse) {
      caisse = await this.caisseRepository.findOne({ where: { id_caisse } });
      if (!caisse) {
        throw new NotFoundException(
          `Caisse avec l'ID ${id_caisse} non trouvée`,
        );
      }
    }
    if (id_compte) {
      compte = await this.compteRepository.findOne({ where: { id_compte } });
      if (!compte) {
        throw new NotFoundException(`Compte avec l'ID ${id_compte} non trouvé`);
      }
    }

    // Récupérer toutes les factures du client
    const factures = await this.commandeVenteRepository
      .createQueryBuilder('commande')
      .where('commande.id_client = :id_client', { id_client })
      .orderBy('commande.date_commande_vente', 'ASC')
      .getMany();

    console.log(
      `Factures récupérées pour le client ${id_client}: ${factures.length}`,
    );

    // Prioriser les factures spécifiées
    let prioritizedFactures = [...factures];
    if (id_commandes_vente && id_commandes_vente.length > 0) {
      console.log('Factures demandées:', id_commandes_vente);

      // Vérifier que les factures existent
      const facturesExistantes = factures.filter((f) =>
        id_commandes_vente.includes(f.id_commande_vente.toString()),
      );

      if (facturesExistantes.length === 0) {
        throw new BadRequestException(
          `Aucune des factures spécifiées (${id_commandes_vente.join(', ')}) n'existe pour ce client`,
        );
      }

      // Identifier les factures manquantes
      const missingIds = id_commandes_vente.filter(
        (id) => !factures.some((f) => f.id_commande_vente.toString() === id),
      );

      if (missingIds.length > 0) {
        throw new BadRequestException(
          `Les factures suivantes n'existent pas pour ce client: ${missingIds.join(', ')}`,
        );
      }

      // Filtrer les factures valides (avec montant dû > 0)
      const facturesValides = facturesExistantes.filter((f) => {
        const montantDu = f.montant_total - (f.montant_paye || 0);
        return montantDu > 0;
      });

      if (facturesValides.length === 0) {
        const facturesReglees = facturesExistantes.filter((f) => {
          const montantDu = f.montant_total - (f.montant_paye || 0);
          return montantDu <= 0;
        });

        throw new BadRequestException(
          `Toutes les factures spécifiées sont déjà entièrement réglées: ${facturesReglees.map((f) => f.id_commande_vente).join(', ')}`,
        );
      }

      // Avertir des factures déjà réglées
      const facturesDejaReglees = facturesExistantes.filter((f) => {
        const montantDu = f.montant_total - (f.montant_paye || 0);
        return montantDu <= 0;
      });

      if (facturesDejaReglees.length > 0) {
        console.log(
          `Avertissement: Ces factures sont déjà réglées et seront ignorées: ${facturesDejaReglees.map((f) => f.id_commande_vente).join(', ')}`,
        );
      }

      // Prioriser les factures valides
      prioritizedFactures = [
        ...facturesValides.sort(
          (a, b) =>
            id_commandes_vente.indexOf(a.id_commande_vente.toString()) -
            id_commandes_vente.indexOf(b.id_commande_vente.toString()),
        ),
        ...factures.filter((f) => {
          const nonSpecifiee = !id_commandes_vente.includes(
            f.id_commande_vente.toString(),
          );
          const montantDu = f.montant_total - (f.montant_paye || 0);
          return nonSpecifiee && montantDu > 0;
        }),
      ];

      console.log(
        `Factures valides pour règlement: ${facturesValides.map((f) => f.id_commande_vente).join(', ')}`,
      );
    } else {
      // Si aucune facture spécifiée, utiliser les factures avec solde dû
      prioritizedFactures = factures.filter((f) => {
        const montantDu = f.montant_total - (f.montant_paye || 0);
        return montantDu > 0;
      });
    }

    // Vérifier qu'il y a des factures à traiter
    if (prioritizedFactures.length === 0) {
      throw new BadRequestException(
        'Aucune facture disponible pour ce règlement. Toutes les factures du client sont déjà entièrement réglées.',
      );
    }

    console.log(
      `Factures ${id_commandes_vente ? id_commandes_vente.join(', ') + ' ' : ''}priorisées pour le règlement.`,
    );

    // Distribution du montant sur les factures
    let montantRestant = montant;
    const facturesAffectees: PaymentDistributionResult['facturesAffectees'] =
      [];
    const reglementsToSave: Reglement[] = [];

    let montantAppliqueAuxFactures = 0;
    for (const facture of prioritizedFactures) {
      if (montantRestant <= 0) break;

      const montantDu = facture.montant_total - (facture.montant_paye || 0);
      if (montantDu <= 0) {
        console.log(
          `Facture ${facture.id_commande_vente} déjà réglée, ignorée`,
        );
        continue;
      }

      const montantAffecte = Math.min(montantRestant, montantDu);
      montantRestant -= montantAffecte;
      montantAppliqueAuxFactures += montantAffecte;

      facture.montant_paye = (facture.montant_paye || 0) + montantAffecte;
      facture.montant_restant = facture.montant_total - facture.montant_paye;
      facture.reglee = facture.montant_restant <= 0 ? 1 : 0;

      const reglement = new Reglement();
      reglement.id_client = id_client;
      reglement.client = client;
      reglement.montant = montantAffecte;
      reglement.date = date;
      reglement.id_commande_vente = facture.id_commande_vente.toString();
      reglement.commandeVente = facture;
      reglement.id_type_reglement = id_type_reglement;
      reglement.typeReglement = typeReglement;
      reglement.id_caisse = id_caisse || null;
      reglement.caisse = caisse || null;
      reglement.id_compte = id_compte || null;
      reglement.compte = compte || null;

      reglementsToSave.push(reglement);

      facturesAffectees.push({
        id_commande_vente: facture.id_commande_vente.toString(),
        montant_total: facture.montant_total,
        montant_paye_avant: (facture.montant_paye || 0) - montantAffecte,
        montant_paye_actuel: montantAffecte,
        montant_restant: facture.montant_restant,
        reglee: facture.reglee === 1,
      });

      console.log(
        `Facture ${facture.id_commande_vente} mise à jour: montant_paye=${facture.montant_paye}, montant_restant=${facture.montant_restant}`,
      );
    }

    // Mise à jour du solde et avance du client
    client.solde = (client.solde || 0) - montantAppliqueAuxFactures;
    if (client.solde < 0) {
      client.solde = 0;
    }

    if (montantRestant > 0) {
      client.avance = (client.avance || 0) + montantRestant;
      console.log(
        `Avance mise à jour pour le client ${id_client}: ${client.avance}`,
      );
    }

    // Préparation des mouvements de caisse/compte
    let mouvementCaisse: MouvementCaisse | null = null;
    let mouvementCompte: MouvementCompte | null = null;

    if (caisse) {
      const soldeCaisseAvant = caisse.solde || 0;
      caisse.solde = soldeCaisseAvant + montant;

      mouvementCaisse = new MouvementCaisse();
      mouvementCaisse.id_caisse = caisse.id_caisse;
      mouvementCaisse.caisse = caisse;
      mouvementCaisse.type_mouvement = 'ENTREE';
      mouvementCaisse.montant = montant;
      mouvementCaisse.date_mouvement = new Date(date);
      mouvementCaisse.type_operation = 'REGLEMENT';
      mouvementCaisse.solde_avant = soldeCaisseAvant;
      mouvementCaisse.solde_apres = caisse.solde;
      mouvementCaisse.libelle = `Règlement client ${client.nom || client.id_client} - ${facturesAffectees.length} facture(s) : ${facturesAffectees.map((f) => f.id_commande_vente).join(', ')}`;
    }

    if (compte) {
      const soldeCompteAvant = compte.solde || 0;
      compte.solde = soldeCompteAvant + montant;

      mouvementCompte = new MouvementCompte();
      mouvementCompte.id_compte = compte.id_compte;
      mouvementCompte.compte = compte;
      mouvementCompte.type_mouvement = 'CREDIT';
      mouvementCompte.montant = montant;
      mouvementCompte.date_mouvement = new Date(date);
      mouvementCompte.type_operation = 'REGLEMENT';
      mouvementCompte.solde_avant = soldeCompteAvant;
      mouvementCompte.solde_apres = compte.solde;
      mouvementCompte.libelle = `Règlement ${typeReglement.type_reglement || typeReglement.type_reglement} - Client ${client.nom || client.id_client} - ${facturesAffectees.length} facture(s)`;
      mouvementCompte.numero_piece =
        typeReglement.type_reglement === 'D' ? 'Chèque à définir' : null;
    }

    // Transaction pour sauvegarder toutes les modifications
    try {
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        // Sauvegarder caisse et son mouvement
        if (caisse && mouvementCaisse) {
          await transactionalEntityManager.save(Caisse, caisse);
          await transactionalEntityManager.save(
            MouvementCaisse,
            mouvementCaisse,
          );
        }

        // Sauvegarder compte et son mouvement
        if (compte && mouvementCompte) {
          await transactionalEntityManager.save(Compte, compte);
          await transactionalEntityManager.save(
            MouvementCompte,
            mouvementCompte,
          );
        }

        // Sauvegarder client et factures
        await transactionalEntityManager.save(Client, client);
        await transactionalEntityManager.save(
          CommandeVente,
          prioritizedFactures,
        );

        // Sauvegarder les règlements
        const savedReglements = await transactionalEntityManager.save(
          Reglement,
          reglementsToSave,
        );

        // Mettre à jour les mouvements avec l'ID du règlement
        if (mouvementCaisse && savedReglements.length > 0) {
          mouvementCaisse.id_reglement = savedReglements[0].id_reglement;
          await transactionalEntityManager.save(
            MouvementCaisse,
            mouvementCaisse,
          );
        }

        if (mouvementCompte && savedReglements.length > 0) {
          mouvementCompte.id_reglement = savedReglements[0].id_reglement;
          await transactionalEntityManager.save(
            MouvementCompte,
            mouvementCompte,
          );
        }
      });

      // Générer le reçu de paiement
      const receipt = await this.generatePaymentReceipt({
        client,
        facturesAffectees,
        montant,
        date,
        typeReglement,
        caisse,
        compte,
      });

      // Logs de confirmation
      if (caisse) {
        console.log(
          `✅ Caisse ${id_caisse} mise à jour: solde=${caisse.solde} (mouvement enregistré)`,
        );
      }
      if (compte) {
        console.log(
          `✅ Compte ${id_compte} mis à jour: solde=${compte.solde} (mouvement enregistré)`,
        );
      }
      console.log(
        `✅ Client ${id_client} mis à jour: solde=${client.solde}, avance=${client.avance}`,
      );
      console.log(
        '✅ Règlements créés et factures mises à jour:',
        JSON.stringify(facturesAffectees, null, 2),
      );

      return {
        facturesAffectees,
        avance: client.avance,
        montantRestant,
        receipt,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création du règlement:', error);
      throw new BadRequestException('Erreur lors de la création du règlement');
    }
  }
}
