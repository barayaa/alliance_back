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

    if (!id_client || montant <= 0 || !date || !id_type_reglement) {
      throw new BadRequestException(
        'id_client, montant positif, date et id_type_reglement sont requis',
      );
    }

    const client = await this.clientRepository.findOne({
      where: { id_client },
    });
    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${id_client} non trouvé`);
    }

    const typeReglement = await this.typeReglementRepository.findOne({
      where: { id_type_reglement },
    });
    if (!typeReglement) {
      throw new NotFoundException(
        `Type de règlement avec l'ID ${id_type_reglement} non trouvé`,
      );
    }

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

    // CORRECTION: Récupérer TOUTES les factures du client, pas seulement les non réglées
    const factures = await this.commandeVenteRepository
      .createQueryBuilder('commande')
      .where('commande.id_client = :id_client', { id_client })
      .orderBy('commande.date_commande_vente', 'ASC')
      .getMany();

    console.log(
      `Factures récupérées pour le client ${id_client}: ${factures.length}`,
    );

    // Amélioration de la validation des factures spécifiées
    let prioritizedFactures = [...factures];
    if (id_commandes_vente && id_commandes_vente.length > 0) {
      console.log('Factures demandées:', id_commandes_vente);
      console.log(
        'Factures disponibles:',
        factures.map((f) => ({
          id: f.id_commande_vente.toString(),
          reglee: f.reglee,
          montant_restant: f.montant_restant,
          montant_total: f.montant_total,
          montant_paye: f.montant_paye || 0,
        })),
      );

      // Vérifier d'abord si les factures existent AVANT de filtrer par statut
      const facturesExistantes = factures.filter((f) =>
        id_commandes_vente.includes(f.id_commande_vente.toString()),
      );

      if (facturesExistantes.length === 0) {
        throw new BadRequestException(
          `Aucune des factures spécifiées (${id_commandes_vente.join(', ')}) n'existe pour ce client`,
        );
      }

      // Identifier les factures qui n'existent pas
      const missingIds = id_commandes_vente.filter(
        (id) => !factures.some((f) => f.id_commande_vente.toString() === id),
      );

      if (missingIds.length > 0) {
        throw new BadRequestException(
          `Les factures suivantes n'existent pas pour ce client: ${missingIds.join(', ')}`,
        );
      }

      // Ne filtrer que les factures qui PEUVENT recevoir un paiement
      const facturesValides = facturesExistantes.filter((f) => {
        const montantDu = f.montant_total - (f.montant_paye || 0);
        return montantDu > 0; // Seules les factures avec un montant dû > 0 peuvent recevoir un paiement
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

      // Identifier les factures spécifiées qui sont déjà réglées (pour information)
      const facturesDejaReglees = facturesExistantes.filter((f) => {
        const montantDu = f.montant_total - (f.montant_paye || 0);
        return montantDu <= 0;
      });

      if (facturesDejaReglees.length > 0) {
        console.log(
          `Avertissement: Ces factures sont déjà réglées et seront ignorées: ${facturesDejaReglees.map((f) => f.id_commande_vente).join(', ')}`,
        );
      }

      // Utiliser seulement les factures valides pour le règlement
      prioritizedFactures = [
        ...facturesValides.sort(
          (a, b) =>
            id_commandes_vente.indexOf(a.id_commande_vente.toString()) -
            id_commandes_vente.indexOf(b.id_commande_vente.toString()),
        ),
        // Ajouter les autres factures non réglées du client (non spécifiées)
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
      // Si aucune facture spécifiée, utiliser seulement les factures avec un solde dû
      prioritizedFactures = factures.filter((f) => {
        const montantDu = f.montant_total - (f.montant_paye || 0);
        return montantDu > 0;
      });
    }

    // Vérifier qu'il y a au moins une facture à traiter
    if (prioritizedFactures.length === 0) {
      throw new BadRequestException(
        'Aucune facture disponible pour ce règlement. Toutes les factures du client sont déjà entièrement réglées.',
      );
    }

    console.log(
      `Factures ${id_commandes_vente ? id_commandes_vente.join(', ') + ' ' : ''}priorisées pour le règlement.`,
    );

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

    if (caisse) {
      caisse.solde = (caisse.solde || 0) + montant;
    }
    if (compte) {
      compte.solde = (compte.solde || 0) + montant;
    }

    try {
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        if (caisse) {
          await transactionalEntityManager.save(Caisse, caisse);
        }
        if (compte) {
          await transactionalEntityManager.save(Compte, compte);
        }
        await transactionalEntityManager.save(Client, client);
        await transactionalEntityManager.save(
          CommandeVente,
          prioritizedFactures,
        );
        await transactionalEntityManager.save(Reglement, reglementsToSave);
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

      if (caisse) {
        console.log(
          `Solde de la caisse ${id_caisse} mis à jour: ${caisse.solde}`,
        );
      }
      if (compte) {
        console.log(`Solde du compte ${id_compte} mis à jour: ${compte.solde}`);
      }
      console.log(
        `Client ${id_client} mis à jour: solde=${client.solde}, avance=${client.avance}`,
      );
      console.log(
        'Règlements créés et factures mises à jour:',
        JSON.stringify(facturesAffectees, null, 2),
      );

      return {
        facturesAffectees,
        avance: client.avance,
        montantRestant,
        receipt, // Retourner le buffer du PDF
      };
    } catch (error) {
      console.error('Erreur lors de la création du règlement:', error);
      throw new BadRequestException('Erreur lors de la création du règlement');
    }
  }

  private async debugPDFKit() {
    console.log('=== DEBUG PDFKIT ===');

    try {
      // Test 1: require direct
      const pdfkit1 = require('pdfkit');
      console.log('require("pdfkit"):', typeof pdfkit1);
      console.log('pdfkit1 constructor:', typeof pdfkit1);

      // Test 2: require avec .default
      const pdfkit2 = require('pdfkit').default;
      console.log('require("pdfkit").default:', typeof pdfkit2);

      // Test 3: Tentative de création
      if (typeof pdfkit1 === 'function') {
        console.log('✅ pdfkit1 est une fonction, test de création...');
        const testDoc = new pdfkit1();
        console.log('✅ new pdfkit1() réussi');
        testDoc.end(); // Terminer le test
      } else {
        console.log("❌ pdfkit1 n'est pas une fonction");
      }
    } catch (error) {
      console.error('❌ Erreur debug:', error.message);
    }

    console.log('=== FIN DEBUG ===');
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
    console.log('🔍 Début génération PDF...');

    // Essayer de récupérer le constructeur PDFDocument
    let PDFDocConstructor: any = null;

    try {
      // Méthode 1: require direct
      PDFDocConstructor = require('pdfkit');
      console.log('📄 PDFKit trouvé via require:', typeof PDFDocConstructor);
    } catch (e) {
      console.log('⚠️ require("pdfkit") échoué:', e.message);

      try {
        // Méthode 2: avec .default
        PDFDocConstructor = require('pdfkit').default;
        console.log(
          '📄 PDFKit trouvé via require.default:',
          typeof PDFDocConstructor,
        );
      } catch (e2) {
        console.log('⚠️ require("pdfkit").default échoué:', e2.message);

        try {
          // Méthode 3: import dynamique
          const pdfModule = await import('pdfkit');
          PDFDocConstructor = pdfModule.default || pdfModule;
          console.log(
            '📄 PDFKit trouvé via import dynamique:',
            typeof PDFDocConstructor,
          );
        } catch (e3) {
          console.log('⚠️ import dynamique échoué:', e3.message);
        }
      }
    }

    // Vérifier si on a un constructeur valide
    if (typeof PDFDocConstructor !== 'function') {
      console.error('❌ Impossible de trouver le constructeur PDFDocument');
      console.error('Type trouvé:', typeof PDFDocConstructor);
      console.error('Valeur:', PDFDocConstructor);

      // Retourner un reçu texte simple en fallback
      return this.generateSimpleTextReceipt(data);
    }

    console.log('✅ Constructeur PDFDocument trouvé, création du document...');

    // Créer le document PDF
    const doc = new PDFDocConstructor({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'Reçu de Paiement AllPharma',
        Author: 'AllPharma',
        Subject: `Reçu client ${data.client.id_client}`,
        CreationDate: new Date(),
      },
    });

    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        buffers.push(chunk);
      });

      doc.on('end', () => {
        try {
          const pdfBuffer = Buffer.concat(buffers);
          console.log(
            `✅ PDF généré avec succès. Taille: ${pdfBuffer.length} bytes`,
          );
          resolve(pdfBuffer);
        } catch (error) {
          console.error('❌ Erreur concaténation buffers:', error);
          reject(error);
        }
      });

      doc.on('error', (error) => {
        console.error('❌ Erreur document PDF:', error);
        reject(error);
      });

      try {
        // Contenu du PDF (version simplifiée pour éviter les erreurs)
        doc.fontSize(20).text('REÇU DE PAIEMENT', { align: 'center' });
        doc.moveDown();

        // Numéro et date
        const receiptNumber = `RCP-${Date.now()}`;
        doc
          .fontSize(12)
          .text(`Numéro: ${receiptNumber}`)
          .text(`Date: ${data.date}`)
          .moveDown();

        // Client
        doc.fontSize(14).text('CLIENT:', { underline: true });
        doc
          .fontSize(12)
          .text(`ID: ${data.client.id_client}`)
          .text(`Nom: ${data.client.nom || 'N/A'}`)
          .moveDown();

        // Paiement
        doc.fontSize(14).text('PAIEMENT:', { underline: true });
        doc
          .fontSize(12)
          .text(`Montant: ${data.montant.toLocaleString()} FCFA`)
          .text(
            `Type: ${this.getTypeReglementLabel(data.typeReglement.type_reglement)}`,
          )
          .moveDown();

        // Factures
        if (data.facturesAffectees && data.facturesAffectees.length > 0) {
          doc.fontSize(14).text('FACTURES RÉGLÉES:', { underline: true });
          doc.fontSize(10);

          data.facturesAffectees.forEach((facture) => {
            doc.text(
              `• Facture ${facture.id_commande_vente}: ${facture.montant_paye_actuel.toLocaleString()} FCFA`,
            );
          });
          doc.moveDown();
        }

        // Pied de page
        doc
          .fontSize(10)
          .text('Merci pour votre paiement!', { align: 'center' })
          .text('Généré par AllPharma', { align: 'center' });

        console.log('📝 Contenu PDF ajouté, finalisation...');
        doc.end();
      } catch (error) {
        console.error('❌ Erreur création contenu PDF:', error);
        reject(error);
      }
    });
  }

  private generateSimpleTextReceipt(data: any): Buffer {
    console.log('📝 Génération reçu texte de fallback...');

    const receiptContent = `
===============================================
              REÇU DE PAIEMENT
===============================================

Numéro: RCP-${Date.now()}
Date: ${data.date}

-----------------------------------------------
CLIENT:
-----------------------------------------------
ID: ${data.client.id_client}
Nom: ${data.client.nom || 'N/A'}

-----------------------------------------------
PAIEMENT:
-----------------------------------------------
Montant: ${data.montant.toLocaleString()} FCFA
Type: ${this.getTypeReglementLabel(data.typeReglement.type_reglement)}

${data.caisse ? `Caisse: ${data.caisse.nom || data.caisse.id_caisse}\n` : ''}${data.compte ? `Compte: ${data.compte.numero_compte || data.compte.id_compte}\n` : ''}
-----------------------------------------------
FACTURES RÉGLÉES:
-----------------------------------------------
${
  data.facturesAffectees
    ?.map(
      (f) =>
        `• Facture ${f.id_commande_vente}: ${f.montant_paye_actuel.toLocaleString()} FCFA${f.reglee ? ' (RÉGLÉE)' : ' (PARTIELLE)'}`,
    )
    .join('\n') || 'Paiement en avance (aucune facture spécifique)'
}

===============================================
         Merci pour votre paiement!
              Généré par AllPharma
===============================================
`;

    return Buffer.from(receiptContent, 'utf-8');
  }

  private getTypeReglementLabel(type: string): string {
    const labels = {
      E: 'Espèces',
      D: 'Chèque',
      V: 'Virement',
      CB: 'Carte Bancaire',
    };
    return labels[type] || type;
  }

  //ancienne methode
  // async createReglement(
  //   createReglementDto: CreateReglementDto,
  // ): Promise<PaymentDistributionResult> {
  //   const {
  //     id_client,
  //     montant,
  //     date,
  //     id_type_reglement,
  //     id_caisse,
  //     id_compte,
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

  //   // Récupérer les factures non réglées ou partiellement réglées du client
  //   const factures = await this.commandeVenteRepository
  //     .createQueryBuilder('commande')
  //     .where('commande.id_client = :id_client', { id_client })
  //     .andWhere('(commande.reglee = 0 OR commande.montant_restant > 0)')
  //     .orderBy('commande.date_commande_vente', 'ASC')
  //     .getMany();

  //   console.log(
  //     `Factures récupérées pour le client ${id_client}: ${factures.length}`,
  //   );

  //   let montantRestant = montant;
  //   const facturesAffectees: PaymentDistributionResult['facturesAffectees'] =
  //     [];
  //   const reglementsToSave: Reglement[] = [];

  //   // Répartir le montant sur les factures
  //   let montantAppliqueAuxFactures = 0;
  //   for (const facture of factures) {
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

  //     // Mettre à jour la facture
  //     facture.montant_paye = (facture.montant_paye || 0) + montantAffecte;
  //     facture.montant_restant = facture.montant_total - facture.montant_paye;
  //     facture.reglee = facture.montant_restant <= 0 ? 1 : 0;

  //     // Créer un règlement
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

  //     // Ajouter au récapitulatif
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

  //   // Mettre à jour le solde du client
  //   client.solde = (client.solde || 0) - montantAppliqueAuxFactures;
  //   if (client.solde < 0) {
  //     client.solde = 0; // Éviter un solde négatif
  //   }

  //   // Stocker le surplus comme avance
  //   if (montantRestant > 0) {
  //     client.avance = (client.avance || 0) + montantRestant;
  //     console.log(
  //       `Avance mise à jour pour le client ${id_client}: ${client.avance}`,
  //     );
  //   }

  //   // Mettre à jour le solde de la caisse ou du compte
  //   if (caisse) {
  //     caisse.solde = (caisse.solde || 0) + montant;
  //   }
  //   if (compte) {
  //     compte.solde = (compte.solde || 0) + montant;
  //   }

  //   // Sauvegarder toutes les modifications dans une transaction
  //   try {
  //     await this.dataSource.transaction(async (transactionalEntityManager) => {
  //       if (caisse) {
  //         await transactionalEntityManager.save(Caisse, caisse);
  //       }
  //       if (compte) {
  //         await transactionalEntityManager.save(Compte, compte);
  //       }
  //       await transactionalEntityManager.save(Client, client);
  //       await transactionalEntityManager.save(CommandeVente, factures);
  //       await transactionalEntityManager.save(Reglement, reglementsToSave);
  //     });

  //     // Logs pour le débogage
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
  //     };
  //   } catch (error) {
  //     console.error('Erreur lors de la création du règlement:', error);
  //     throw new BadRequestException('Erreur lors de la création du règlement');
  //   }
  // }
}
