import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { Proformat } from './proformat.entity';
import { CreateProformatDto } from './dto/create-proformat.dto';
import { UpdateProformatDto } from './dto/update-proformat.dto';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';
import { Client } from '../client/client.entity';
import { Produit } from '../produit/produit.entity';
import { LignesProformat } from '../lignes_proformat/lignes_proformat.entity';
import { Log } from 'src/log/log.entity';
import { Isb } from 'src/isb/isb.entity';
import { LignesCommandeVenteService } from 'src/lignes_commande_vente/lignes_commande_vente.service';
import { CaptureStockService } from 'src/capture_stock/capture_stock.service';
import { CommandeVente } from 'src/commande_vente/commande_vente.entity';
import { CreateLignesCommandeVenteDto } from 'src/lignes_commande_vente/dto/create-lignes_commande_vente.dto';

function sanitizeString(str: string | null | undefined): string {
  if (!str) return 'N/A';
  return str.replace(/[^\w\s-]/g, '').trim();
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) {
    console.log('Date vide:', date);
    return 'N/A';
  }

  // Si c'est déjà un objet Date, formater directement
  if (date instanceof Date) {
    return date.toLocaleDateString('fr-FR'); // JJ/MM/AAAA
  }

  // Convertir en chaîne si ce n'est pas déjà une chaîne
  const dateStr = String(date).trim();
  console.log('Date brute:', dateStr); // Log pour déboguer

  // Essayer avec new Date
  try {
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('fr-FR'); // JJ/MM/AAAA
    }
  } catch {
    console.log('Échec new Date pour:', dateStr);
  }

  // Essayer de parser manuellement les formats courants
  // Format YYYY-MM-DD
  const ymdMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    try {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1; // Mois de 0 à 11
      const day = parseInt(ymdMatch[3], 10);
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('fr-FR'); // JJ/MM/AAAA
      }
    } catch {
      console.log('Échec parsing YYYY-MM-DD pour:', dateStr);
    }
  }

  // Format DD/MM/YYYY
  const dmyMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmyMatch) {
    try {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('fr-FR'); // JJ/MM/AAAA
      }
    } catch {
      console.log('Échec parsing DD/MM/YYYY pour:', dateStr);
    }
  }

  // Format YYYY/MM/DD
  const ymdSlashMatch = dateStr.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (ymdSlashMatch) {
    try {
      const year = parseInt(ymdSlashMatch[1], 10);
      const month = parseInt(ymdSlashMatch[2], 10) - 1;
      const day = parseInt(ymdSlashMatch[3], 10);
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('fr-FR'); // JJ/MM/AAAA
      }
    } catch {
      console.log('Échec parsing YYYY/MM/DD pour:', dateStr);
    }
  }

  // Si aucun format ne fonctionne
  console.log('Format de date non reconnu:', dateStr);
  return 'N/A';
}

@Injectable()
export class ProformatService {
  private readonly VALID_TYPES = ['full', 'simple', 'bl', 'bp'] as const;
  private readonly MARGINS = 40;
  private readonly PAGE_WIDTH = 595.28; // A4 width
  private readonly HEADER_HEIGHT = 80;
  private readonly ROW_HEIGHT = 20;
  private readonly MAX_Y = 750;
  constructor(
    @InjectRepository(Proformat)
    private proformatRepository: Repository<Proformat>,
    @InjectRepository(LignesCommandeVente)
    private lignesCommandeVenteRepository: Repository<LignesCommandeVente>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(LignesProformat)
    private lignesProformatRepository: Repository<LignesProformat>,

    @InjectRepository(Log)
    private logRepository: Repository<Log>,

    @InjectRepository(Isb)
    private isbRepository: Repository<Isb>,

    private lignesCommandeVenteService: LignesCommandeVenteService,
    private captureStockService: CaptureStockService,
  ) {}

  async findAll(date_debut?: string, date_fin?: string): Promise<Proformat[]> {
    // console.log('Filtres reçus:', { date_debut, date_fin });

    const where: any = {};

    if (date_debut && date_fin) {
      const startDate = new Date(date_debut);
      const endDate = new Date(date_fin);
      endDate.setHours(23, 59, 59, 999); // Inclure toute la journée
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Dates invalides');
      }
      where.date_commande_vente = Between(startDate, endDate);
    }

    try {
      const proformats = await this.proformatRepository.find({
        where,
        relations: ['client'],
        order: {
          date_commande_vente: 'DESC', // Trier par date_commande_vente, plus récent en premier
        },
      });
      // console.log('Proformats trouvés:', JSON.stringify(proformats, null, 2));
      return proformats;
    } catch (error) {
      // console.error(
      //   'Erreur lors de la récupération des proformats:',
      //   JSON.stringify(error, null, 2),
      // );
      throw new BadRequestException(
        'Erreur lors de la récupération des proformats',
      );
    }
  }

  findByclient(id_client: number): Promise<Proformat[]> {
    return this.proformatRepository.find({
      where: { id_client },
      relations: ['client', 'lignes'],
      order: { date_commande_vente: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Proformat> {
    if (!id || isNaN(id)) {
      throw new BadRequestException('ID invalide');
    }
    const entity = await this.proformatRepository.findOne({
      where: { id_commande_vente: id },
      relations: {
        client: true,
        lignes: true,
      },
    });
    if (!entity) {
      throw new NotFoundException(`Proformat avec id ${id} non trouvé`);
    }
    return entity;
  }

  async create(dto: CreateProformatDto): Promise<Proformat> {
    console.log('Payload Proformat reçu:', JSON.stringify(dto, null, 2));

    return this.proformatRepository.manager.transaction(async (manager) => {
      try {
        // Valider le client
        const client = await manager.findOneBy(Client, {
          id_client: dto.id_client,
        });
        if (!client) {
          throw new BadRequestException(
            `Client avec id ${dto.id_client} non trouvé`,
          );
        }

        // Gérer l'ISB selon le type_isb
        let isbRate = 0;
        if (dto.type_isb) {
          const isbs = await manager.find(Isb, { select: ['isb', 'taux'] });
          const isbRecord = isbs.find((isb) => isb.isb === dto.type_isb);
          if (isbRecord) {
            isbRate = parseFloat(isbRecord.taux) || 0;
          } else {
            const isbMapping: { [key: string]: number } = {
              '0%': 0,
              '2%': 0.02,
              '5%': 0.05,
            };
            isbRate = isbMapping[dto.type_isb] || 0.02; // 2% par défaut
          }
        }
        console.log('Taux ISB appliqué:', isbRate, 'pour type:', dto.type_isb);

        // TVA : utiliser celle fournie ou 0
        const tvaCommande =
          dto.tva != null && !isNaN(dto.tva) && dto.tva >= 0 ? dto.tva : 0;
        console.log('TVA générale appliquée:', tvaCommande, '%');

        // Génération numéro facture proforma
        const currentYear = new Date().getFullYear();
        const lastProformat = await manager.findOne(Proformat, {
          where: {
            type_facture: 'PR',
            numero_facture_certifiee: Like(`%-${currentYear}`),
          },
          order: { numero_seq: 'DESC' },
        });
        const numero_seq = lastProformat ? lastProformat.numero_seq + 1 : 1;
        const numero_facture_certifiee = `${numero_seq.toString().padStart(4, '0')}-${currentYear}`;

        // Vérifier unicité
        const existingProformat = await manager.findOne(Proformat, {
          where: { numero_facture_certifiee },
        });
        if (existingProformat) {
          throw new BadRequestException(
            `Un proforma existe déjà avec le numéro ${numero_facture_certifiee}`,
          );
        }

        // Créer le proforma (temporairement avec valeurs par défaut)
        const proformat = manager.create(Proformat, {
          date_commande_vente: new Date(dto.date_commande_vente),
          montant_total: 0, // Sera calculé
          montant_paye: 0,
          montant_restant: 0, // Sera calculé
          remise: 0, // Sera calculé
          validee: 1,
          statut: 0,
          id_client: dto.id_client,
          client,
          reglee: 0,
          moyen_reglement: 0,
          type_reglement: dto.type_reglement || 'E',
          tva: 0, // Sera le montant TVA calculé
          type_isb: dto.type_isb || '2%',
          isb: 0, // Sera calculé
          avoir: 0,
          login: dto.login,
          type_facture: 'PR',
          reponse_mcf: '',
          qrcode: '',
          client_vd: dto.client_vd || null,
          nif_vd: dto.nif_vd || null,
          adresse_vd: dto.adresse_vd || null,
          telephone_vd: dto.telephone_vd || null,
          email_vd: dto.email_vd || null,
          ville_vd: dto.ville_vd || null,
          commentaire1: dto.commentaire1 || null,
          commentaire2: dto.commentaire2 || null,
          commentaire3: dto.commentaire3 || null,
          commentaire4: dto.commentaire4 || null,
          commentaire5: dto.commentaire5 || null,
          commentaire6: dto.commentaire6 || null,
          commentaire7: dto.commentaire7 || null,
          commentaire8: dto.commentaire8 || null,
          certifiee: 'NON',
          numero_seq,
          numero_facture_certifiee,
          imprimee: 0,
          statut_proformat: 0,
          facture_definitive: 'Non',
        });

        const savedProformat = await manager.save(Proformat, proformat);
        console.log(
          `Proforma sauvegardé avec id: ${savedProformat.id_commande_vente}`,
        );

        // Traitement des lignes - CALCULER D'ABORD LE MONTANT HT TOTAL
        let montant_ht_total = 0; // Total HT (prix * quantité)
        let montant_tva_total = 0; // Montant TVA calculé
        const savedLignes: LignesProformat[] = [];

        for (const ligne of dto.lignes) {
          const produit = await manager.findOneBy(Produit, {
            id_produit: ligne.designation, // designation contient l'id_produit dans proformat
          });
          if (!produit) {
            throw new BadRequestException(
              `Produit avec id ${ligne.designation} non trouvé`,
            );
          }

          // Vérifier que la quantité est valide
          if (ligne.quantite <= 0) {
            throw new BadRequestException(
              `Quantité invalide pour produit ${ligne.designation}: ${ligne.quantite}`,
            );
          }

          const prix_vente = ligne.prix_vente ?? produit.prix_unitaire;
          const remise = ligne.remise || 0;
          const montant_ligne_ht = prix_vente * ligne.quantite * (1 - remise); // Montant HT après remise ligne
          const montant_tva_ligne = montant_ligne_ht * (tvaCommande / 100);

          // Accumulation du montant HT total
          montant_ht_total += montant_ligne_ht;
          montant_tva_total += montant_tva_ligne;

          console.log(`Ligne ${ligne.designation}:`, {
            prix_unitaire: prix_vente,
            quantite: ligne.quantite,
            remise: remise,
            montant_ht: montant_ligne_ht,
            montant_tva: montant_tva_ligne,
          });

          // Formatter la date pour correspondre au type 'varchar' attendu
          const formattedDate = new Date(dto.date_commande_vente)
            .toISOString()
            .split('T')[0]; // Format YYYY-MM-DD

          // Créer la ligne proforma
          const ligneEntity = manager.create(LignesProformat, {
            id_commande_vente: savedProformat.id_commande_vente,
            designation: ligne.designation,
            prix_vente,
            remise,
            description_remise: ligne.description_remise || '',
            prix_vente_avant_remise: (
              ligne.prix_vente_avant_remise || prix_vente
            ).toString(),
            quantite: ligne.quantite,
            montant: montant_ligne_ht,
            group_tva: ligne.group_tva || produit.group_tva || '',
            etiquette_tva: ligne.etiquette_tva || produit.etiquette_tva || '',
            taux_tva: tvaCommande,
            montant_tva: montant_tva_ligne,
            isb_ligne: 0, // ISB géré au niveau proforma
            date: formattedDate, // Conversion en string
            stock_avant: produit.stock_courant,
            stock_apres: produit.stock_courant, // PAS DE MODIFICATION DU STOCK
            retour: 0,
            statut_proformat: 0,
          });

          const savedLigne = await manager.save(LignesProformat, ligneEntity);
          savedLignes.push(savedLigne);
        }

        // Calculer la remise globale
        let montant_remise = 0;
        const remiseFrontend =
          dto.remise != null && !isNaN(dto.remise) && dto.remise >= 0
            ? dto.remise
            : 0;

        if (remiseFrontend > 0) {
          if (remiseFrontend < 1) {
            // C'est un taux (ex: 0.02 = 2%)
            montant_remise = montant_ht_total * remiseFrontend;
            console.log(
              `Remise calculée: ${montant_ht_total} × ${remiseFrontend} = ${montant_remise} CFA`,
            );
          } else {
            // C'est un montant fixe
            montant_remise = remiseFrontend;
            console.log(`Remise fixe: ${montant_remise} CFA`);
          }
        }

        console.log('Remise globale appliquée:', montant_remise, 'CFA');

        // Calcul du montant HT après remise globale
        const montant_ht_apres_remise = montant_ht_total - montant_remise;

        // Recalculer la TVA sur le montant après remise globale
        montant_tva_total = montant_ht_apres_remise * (tvaCommande / 100);

        // Timbre fiscal
        const timbre_fiscal = 200; // Fixe

        // Calcul ISB/Précompte sur (montant HT après remise + timbre fiscal)
        const base_calcul_isb = montant_ht_apres_remise + timbre_fiscal;
        const montant_isb = base_calcul_isb * isbRate;

        // Calcul du total : (HT - Remise) + TVA + ISB + Timbre
        const montant_total_final =
          montant_ht_apres_remise +
          montant_tva_total +
          montant_isb +
          timbre_fiscal;

        console.log('Calculs finaux Proforma:', {
          montant_ht_initial: montant_ht_total,
          remise: montant_remise,
          montant_ht_apres_remise: montant_ht_apres_remise,
          timbre_fiscal: timbre_fiscal,
          base_calcul_isb: base_calcul_isb,
          taux_isb: isbRate,
          montant_isb: montant_isb,
          montant_tva: montant_tva_total,
          total_final: montant_total_final,
        });

        // Mise à jour du proforma
        await manager.update(
          Proformat,
          { id_commande_vente: savedProformat.id_commande_vente },
          {
            montant_total: montant_total_final,
            montant_restant: montant_total_final,
            tva: montant_tva_total,
            isb: montant_isb,
            remise: montant_remise,
          },
        );

        // Mise à jour objet retourné
        savedProformat.montant_total = montant_total_final;
        savedProformat.montant_restant = montant_total_final;
        savedProformat.tva = montant_tva_total;
        savedProformat.isb = montant_isb;
        savedProformat.remise = montant_remise;
        savedProformat.lignes = savedLignes;
        savedProformat.client = client;

        // Log
        const logEntry = manager.create(Log, {
          log: `Enregistrement de la facture proforma N° ${savedProformat.id_commande_vente}`,
          date: new Date(),
          user: dto.login || 'Utilisateur inconnu',
          archive: 1,
        });
        await manager.save(Log, logEntry);

        console.log('Proforma créé avec succès:', {
          id: savedProformat.id_commande_vente,
          numero: savedProformat.numero_facture_certifiee,
          montant_total: savedProformat.montant_total,
        });

        return savedProformat;
      } catch (error) {
        console.error('Erreur dans la transaction Proforma:', error);
        throw error;
      }
    });
  }

  async createByclient(
    dto: CreateProformatDto,
    user: { id_client: number; login: string },
  ): Promise<Proformat> {
    console.log(dto);

    return this.proformatRepository.manager.transaction(async (manager) => {
      try {
        // Validate that the client exists and matches the logged-in user
        const client = await manager.findOneBy(Client, {
          id_client: user.id_client,
        });
        if (!client) {
          throw new BadRequestException(
            `Client avec id ${user.id_client} non trouvé`,
          );
        }

        // Ensure the DTO's id_client matches the logged-in client's ID
        if (dto.id_client !== user.id_client) {
          throw new BadRequestException(
            'Vous ne pouvez créer une facture proforma que pour vous-même.',
          );
        }

        const currentYear = new Date().getFullYear();
        const lastProformat = await manager.findOne(Proformat, {
          where: {
            type_facture: 'PR',
            numero_facture_certifiee: Like(`%-${currentYear}`),
          },
          order: { numero_seq: 'DESC' },
        });
        const numero_seq = lastProformat ? lastProformat.numero_seq + 1 : 1;
        const numero_facture_certifiee = `${numero_seq.toString().padStart(4, '0')}-${currentYear}`;

        let subtotal = 0;
        let montant_tva = 0;
        let isb_total = 0;
        const lignesToSave = [];

        for (const ligne of dto.lignes) {
          const produit = await manager.findOneBy(Produit, {
            id_produit: ligne.designation,
          });
          if (!produit) {
            throw new BadRequestException(
              `Produit avec id ${ligne.designation} non trouvé`,
            );
          }
          const prix_vente = ligne.prix_vente || produit.prix_unitaire;
          const remise = ligne.remise || 0;
          const montant_ligne = prix_vente * ligne.quantite * (1 - remise);
          const taux_tva = ligne.taux_tva || produit.taux_tva || 0;
          const montant_tva_ligne = montant_ligne * (taux_tva / 100);
          const isb_ligne = ligne.isb_ligne || montant_ligne * 0.02; // ISB par défaut à 2%
          subtotal += montant_ligne;
          montant_tva += montant_tva_ligne;
          isb_total += isb_ligne;

          lignesToSave.push({
            id_commande_vente: numero_facture_certifiee, // Temporaire, corrigé plus bas
            designation: ligne.designation,
            prix_vente,
            remise,
            description_remise: ligne.description_remise || '',
            prix_vente_avant_remise: (
              ligne.prix_vente_avant_remise || prix_vente
            ).toString(),
            quantite: ligne.quantite,
            montant: montant_ligne,
            group_tva: ligne.group_tva || produit.group_tva || '',
            etiquette_tva: ligne.etiquette_tva || produit.etiquette_tva || '',
            taux_tva,
            montant_tva: montant_tva_ligne,
            isb_ligne,
            date: dto.date_commande_vente,
            stock_avant: produit.stock_courant,
            stock_apres: produit.stock_courant, // Pas de modification du stock pour proforma
            retour: 0,
            statut_proformat: 0,
          });
        }

        const montant_total =
          subtotal + montant_tva + isb_total - (dto.remise || 0);

        const proformat = manager.create(Proformat, {
          date_commande_vente: new Date(dto.date_commande_vente),
          montant_total,
          montant_paye: 0,
          montant_restant: montant_total,
          remise: dto.remise || 0,
          validee: 1,
          statut: 0,
          id_client: user.id_client,
          client,
          reglee: 0,
          moyen_reglement: 0,
          type_reglement: dto.type_reglement || 'E',
          tva: montant_tva,
          type_isb: dto.type_isb || 'A',
          isb: isb_total,
          avoir: 0,
          login: user.login, // Use the logged-in client's login
          type_facture: 'PR',
          reponse_mcf: '',
          qrcode: '',
          client_vd: dto.client_vd || null,
          nif_vd: dto.nif_vd || null,
          adresse_vd: dto.adresse_vd || null,
          telephone_vd: dto.telephone_vd || null,
          email_vd: dto.email_vd || null,
          ville_vd: dto.ville_vd || null,
          commentaire1: dto.commentaire1 || null,
          commentaire2: dto.commentaire2 || null,
          commentaire3: dto.commentaire3 || null,
          commentaire4: dto.commentaire4 || null,
          commentaire5: dto.commentaire5 || null,
          commentaire6: dto.commentaire6 || null,
          commentaire7: dto.commentaire7 || null,
          commentaire8: dto.commentaire8 || null,
          certifiee: 'NON',
          numero_seq,
          numero_facture_certifiee,
          imprimee: 0,
          statut_proformat: 0,
          facture_definitive: 'Non',
        });

        const savedProformat = await manager.save(Proformat, proformat);

        // Initialize lignes if necessary
        if (!savedProformat.lignes) {
          savedProformat.lignes = [];
        }

        for (const ligne of lignesToSave) {
          const ligneEntity = manager.create(LignesProformat, {
            ...ligne,
            id_commande_vente: savedProformat.id_commande_vente, // Use the numeric ID
          });
          await manager.save(LignesProformat, ligneEntity);
          savedProformat.lignes.push(ligneEntity);
        }

        savedProformat.client = client;

        const logEntry = manager.create(Log, {
          log: `Enregistrement de la facture proformat N° ${savedProformat.id_commande_vente} par le client ${user.login}`,
          date: new Date(),
          user: user.login,
          archive: 1,
        });
        await manager.save(Log, logEntry);

        return savedProformat;
      } catch (error) {
        console.error(
          'Erreur dans la transaction:',
          JSON.stringify(error, null, 2),
        );
        throw error;
      }
    });
  }

  async cancel(id: number): Promise<void> {
    console.log(`Tentative d'annulation du proformat avec ID: ${id}`);
    const proformat = await this.proformatRepository.findOne({
      where: { id_commande_vente: id },
    });
    if (!proformat) {
      console.log(`Proformat avec ID ${id} non trouvé`);
      throw new NotFoundException(`Proformat avec ID ${id} non trouvé`);
    }

    proformat.statut = 1; // Exemple : marquer comme annulé (ajuste selon ta logique)
    await this.proformatRepository.save(proformat);
    console.log(`Proformat ${id} annulé avec succès`);
  }

  async convertToCommandeVente(
    id_commande_vente: number,
    login: string,
  ): Promise<CommandeVente> {
    return this.proformatRepository.manager.transaction(async (manager) => {
      try {
        // Étape 1 : Récupérer et valider la proforma
        const proformat = await manager.findOne(Proformat, {
          where: { id_commande_vente },
          relations: ['client', 'lignes', 'lignes.produit'],
        });

        if (!proformat) {
          throw new NotFoundException(
            `Proforma avec id ${id_commande_vente} non trouvée`,
          );
        }

        if (proformat.facture_definitive === 'Oui') {
          throw new BadRequestException(
            `Proforma ${id_commande_vente} déjà convertie en facture de vente`,
          );
        }

        // Étape 2 : Valider le client
        const client = await manager.findOneBy(Client, {
          id_client: proformat.id_client,
        });
        if (!client) {
          throw new BadRequestException(
            `Client avec id ${proformat.id_client} non trouvé`,
          );
        }

        // Étape 3 : Valider le stock AVANT la conversion
        for (const ligne of proformat.lignes) {
          const produit = await manager.findOneBy(Produit, {
            id_produit: ligne.designation,
          });
          if (!produit) {
            throw new BadRequestException(
              `Produit avec id ${ligne.designation} non trouvé`,
            );
          }
          if (ligne.quantite > produit.stock_courant) {
            throw new BadRequestException(
              `Stock insuffisant pour ${produit.produit}. Disponible: ${produit.stock_courant}, demandé: ${ligne.quantite}`,
            );
          }
        }

        // Étape 4 : Générer le numéro de facture vente
        const currentYear = new Date().getFullYear();
        const lastCommande = await manager.findOne(CommandeVente, {
          where: {
            type_facture: 'FV',
            numero_facture_certifiee: Like(`%-${currentYear}`),
          },
          order: { numero_seq: 'DESC' },
        });
        const numero_seq = lastCommande ? lastCommande.numero_seq + 1 : 1;
        const numero_facture_certifiee = `${numero_seq.toString().padStart(4, '0')}-${currentYear}`;

        // Étape 5 : Créer la CommandeVente avec les MÊMES montants que le proforma
        const commande = manager.create(CommandeVente, {
          date_commande_vente: new Date(), // Date actuelle de conversion
          montant_total: proformat.montant_total, // Copier les montants calculés
          montant_paye: 0,
          montant_restant: proformat.montant_total,
          remise: proformat.remise, // Copier la remise
          validee: 1,
          statut: 0,
          id_client: proformat.id_client,
          client,
          reglee: 0,
          moyen_reglement: 0,
          type_reglement: proformat.type_reglement || 'E',
          tva: proformat.tva, // Copier le montant TVA
          type_isb: proformat.type_isb,
          isb: proformat.isb, // Copier le montant ISB
          avoir: 0,
          login: login, // Login de l'utilisateur qui fait la conversion
          type_facture: 'FV',
          reponse_mcf: '',
          qrcode: '',
          client_vd: proformat.client_vd || '',
          nif_vd: proformat.nif_vd || '',
          adresse_vd: proformat.adresse_vd || '',
          telephone_vd: proformat.telephone_vd || '',
          email_vd: proformat.email_vd || '',
          ville_vd: proformat.ville_vd || '',
          commentaire1: proformat.commentaire1 || '',
          commentaire2: proformat.commentaire2 || '',
          commentaire3: proformat.commentaire3 || '',
          commentaire4: proformat.commentaire4 || '',
          commentaire5: proformat.commentaire5 || '',
          commentaire6: proformat.commentaire6 || '',
          commentaire7: proformat.commentaire7 || '',
          commentaire8: proformat.commentaire8 || '',
          certifiee: 'NON',
          counter_per_receipt_type: '',
          total_receipt_counter: '',
          receipt_type: '',
          process_date_and_time: '',
          device_dentification: '',
          nif_: '',
          signature: '',
          ref_ini: '',
          exoneration: '',
          numero_seq,
          numero_facture_certifiee,
          imprimee: 0, // Pas encore imprimée
          escompte: 0,
        });

        const savedCommande = await manager.save(CommandeVente, commande);
        console.log(
          `CommandeVente créée avec id: ${savedCommande.id_commande_vente}, numéro: ${savedCommande.numero_facture_certifiee}`,
        );

        // Étape 6 : Créer les lignes ET METTRE À JOUR LE STOCK
        const savedLignes: LignesCommandeVente[] = [];

        for (const ligneProforma of proformat.lignes) {
          const produit = await manager.findOneBy(Produit, {
            id_produit: ligneProforma.designation,
          });

          // Créer la ligne de commande vente
          const ligneDto: CreateLignesCommandeVenteDto = {
            id_produit: ligneProforma.designation,
            prix_vente: ligneProforma.prix_vente,
            remise: ligneProforma.remise || 0,
            description_remise: ligneProforma.description_remise || 'Aucune',
            prix_vente_avant_remise:
              ligneProforma.prix_vente_avant_remise ||
              ligneProforma.prix_vente.toString(),
            quantite: ligneProforma.quantite,
            group_tva: ligneProforma.group_tva || '',
            etiquette_tva: ligneProforma.etiquette_tva || '',
            taux_tva: ligneProforma.taux_tva || 0,
            isb_ligne: ligneProforma.isb_ligne || 0,
            date: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD (string)
          };

          // Cette méthode va créer la ligne ET mettre à jour le stock automatiquement
          const savedLigne = await this.lignesCommandeVenteService.create(
            ligneDto,
            savedCommande.id_commande_vente,
            login,
          );

          savedLignes.push(savedLigne);

          console.log(
            `Ligne créée et stock mis à jour pour produit ${produit.produit}:`,
            {
              stock_avant: produit.stock_courant,
              quantite_vendue: ligneProforma.quantite,
              stock_apres: produit.stock_courant - ligneProforma.quantite,
            },
          );
        }

        savedCommande.lignes = savedLignes;

        // Étape 7 : Marquer la proforma comme convertie
        await manager.update(
          Proformat,
          { id_commande_vente: proformat.id_commande_vente },
          {
            facture_definitive: 'Oui',
            statut_proformat: 1,
          },
        );

        console.log(
          `Proforma ${proformat.numero_facture_certifiee} marquée comme convertie`,
        );

        // Étape 8 : Enregistrer un log
        const logEntry = manager.create(Log, {
          log: `Conversion proforma ${proformat.numero_facture_certifiee} en facture vente ${savedCommande.numero_facture_certifiee}`,
          date: new Date(),
          user: login,
          archive: 1,
        });
        await manager.save(Log, logEntry);

        return savedCommande;
      } catch (error) {
        console.error('Erreur lors de la conversion:', error);
        throw error;
      }
    });
  }

  async update(id: number, dto: UpdateProformatDto): Promise<Proformat> {
    return this.proformatRepository.manager.transaction(async (manager) => {
      try {
        const proformat = await manager.findOne(Proformat, {
          where: { id_commande_vente: id },
          relations: ['lignes', 'client'],
        });
        if (!proformat) {
          throw new NotFoundException(`Proformat avec id ${id} non trouvé`);
        }

        // Mise à jour des champs simples du proformat
        if (dto.id_client) {
          const client = await manager.findOneBy(Client, {
            id_client: dto.id_client,
          });
          if (!client) {
            throw new BadRequestException(
              `Client avec id ${dto.id_client} non trouvé`,
            );
          }
          proformat.client = client;
          proformat.id_client = dto.id_client;
        }

        Object.assign(proformat, {
          date_commande_vente: dto.date_commande_vente
            ? new Date(dto.date_commande_vente)
            : proformat.date_commande_vente,
          remise: dto.remise !== undefined ? dto.remise : proformat.remise,
          type_reglement: dto.type_reglement || proformat.type_reglement,
          type_isb: dto.type_isb || proformat.type_isb,
          login: dto.login || proformat.login,
          client_vd: dto.client_vd ?? proformat.client_vd,
          nif_vd: dto.nif_vd ?? proformat.nif_vd,
          adresse_vd: dto.adresse_vd ?? proformat.adresse_vd,
          telephone_vd: dto.telephone_vd ?? proformat.telephone_vd,
          email_vd: dto.email_vd ?? proformat.email_vd,
          ville_vd: dto.ville_vd ?? proformat.ville_vd,
          commentaire1: dto.commentaire1 ?? proformat.commentaire1,
          commentaire2: dto.commentaire2 ?? proformat.commentaire2,
          commentaire3: dto.commentaire3 ?? proformat.commentaire3,
          commentaire4: dto.commentaire4 ?? proformat.commentaire4,
          commentaire5: dto.commentaire5 ?? proformat.commentaire5,
          commentaire6: dto.commentaire6 ?? proformat.commentaire6,
          commentaire7: dto.commentaire7 ?? proformat.commentaire7,
          commentaire8: dto.commentaire8 ?? proformat.commentaire8,
          statut_proformat: dto.statut_proformat ?? proformat.statut_proformat,
        });

        let subtotal = 0;
        let montant_tva = 0;
        let isb_total = 0;

        if (dto.lignes && dto.lignes.length > 0) {
          // Supprimer les lignes existantes
          await manager.delete(LignesProformat, {
            id_commande_vente: proformat.id_commande_vente,
          });
          proformat.lignes = [];

          // Ajouter les nouvelles lignes
          for (const ligne of dto.lignes) {
            const produit = await manager.findOneBy(Produit, {
              id_produit: ligne.designation,
            });
            if (!produit) {
              throw new BadRequestException(
                `Produit avec id ${ligne.designation} non trouvé`,
              );
            }
            const prix_vente = ligne.prix_vente || produit.prix_unitaire || 0;
            const remise = ligne.remise || 0;
            const quantite = ligne.quantite || 0;
            const montant_ligne = prix_vente * quantite * (1 - remise / 100);
            const taux_tva = ligne.taux_tva || produit.taux_tva || 0;
            const montant_tva_ligne = montant_ligne * (taux_tva / 100);
            const isb_ligne = ligne.isb_ligne || montant_ligne * 0.02;
            subtotal += montant_ligne;
            montant_tva += montant_tva_ligne;
            isb_total += isb_ligne;

            const ligneEntity = manager.create(LignesProformat, {
              id_commande_vente: proformat.id_commande_vente,
              designation: ligne.designation,
              prix_vente,
              remise,
              description_remise: ligne.description_remise || '',
              prix_vente_avant_remise: (
                ligne.prix_vente_avant_remise || prix_vente
              ).toString(),
              quantite,
              montant: montant_ligne,
              group_tva: ligne.group_tva || produit.group_tva || '',
              etiquette_tva: ligne.etiquette_tva || produit.etiquette_tva || '',
              taux_tva,
              montant_tva: montant_tva_ligne,
              isb_ligne,
              date: dto.date_commande_vente
                ? new Date(dto.date_commande_vente).toISOString().split('T')[0]
                : proformat.date_commande_vente.toISOString().split('T')[0],
              stock_avant: produit.stock_courant || 0,
              stock_apres: produit.stock_courant || 0, // Pas de modification du stock pour proforma
              retour: ligne.retour || 0,
              statut_proformat: ligne.statut_proformat || 0,
            });
            await manager.save(LignesProformat, ligneEntity);
            proformat.lignes.push(ligneEntity);
          }
        }

        // Recalcul des montants
        proformat.tva = montant_tva;
        proformat.isb = isb_total;
        proformat.montant_total =
          subtotal + montant_tva + isb_total - (proformat.remise || 0);
        proformat.montant_restant =
          proformat.montant_total - (proformat.montant_paye || 0);

        const updatedProformat = await manager.save(Proformat, proformat);

        // Ajout de l'entrée dans la table log pour la modification
        const logEntry = manager.create(Log, {
          log: `Modification de la facture proformat N° ${updatedProformat.numero_facture_certifiee}`,
          date: new Date(),
          user: dto.login || 'Utilisateur inconnu',
          archive: 1,
        });
        await manager.save(Log, logEntry);

        return updatedProformat;
      } catch (error) {
        console.error(
          'Erreur dans la transaction de mise à jour:',
          JSON.stringify(error, null, 2),
        );
        throw error;
      }
    });
  }

  async print(id: number): Promise<Proformat> {
    const entity = await this.findOne(id);
    entity.imprimee = 1;
    return this.proformatRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.proformatRepository.remove(entity);
  }

  async generatePdf(
    id: number,
    res: Response,
    type: 'full' | 'simple' = 'full',
  ): Promise<void> {
    const VALID_TYPES = ['full', 'simple'];

    if (!VALID_TYPES.includes(type)) {
      throw new BadRequestException(`Type de document non valide: ${type}`);
    }

    try {
      // Récupérer le proforma
      const proformat = await this.proformatRepository.findOne({
        where: { id_commande_vente: id },
        relations: ['client', 'lignes', 'lignes.produit'],
      });

      if (!proformat) {
        throw new NotFoundException(`Proforma avec id ${id} non trouvé`);
      }

      if (!proformat.lignes || !proformat.client) {
        throw new BadRequestException('Données de proforma incomplètes');
      }

      // Créer le document PDF
      const doc = new PDFDocument({ size: 'A4', margin: this.MARGINS });
      res.setHeader('Content-Type', 'application/pdf');
      const filename = `proforma_${sanitizeString(proformat.numero_facture_certifiee || proformat.id_commande_vente.toString())}_${type}.pdf`;
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      // Sauvegarde locale pour débogage
      const fs = require('fs');
      doc.pipe(fs.createWriteStream(`test_proforma_${id}.pdf`));
      doc.pipe(res);

      // En-tête commun
      this.drawProformaHeader(doc, proformat);

      // Corps du document
      if (type === 'full') {
        this.drawFullProforma(doc, proformat);
      } else {
        this.drawSimpleProforma(doc, proformat);
      }

      // Finaliser le document
      doc.end();

      // Mettre à jour le proforma
      proformat.imprimee = 1;
      await this.proformatRepository.save(proformat);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({
          message: `Erreur lors de la génération du PDF: ${error.message}`,
        });
      }
      throw new BadRequestException(
        `Erreur lors de la génération du PDF: ${error.message}`,
      );
    }
  }

  private drawProformaHeader(doc: PDFDocument, proformat: any): number {
    const headerTop = 40;
    const sectionWidth = (this.PAGE_WIDTH - 2 * this.MARGINS) / 3;

    // Section 1: Alliance Pharma
    doc
      .rect(this.MARGINS, headerTop, sectionWidth, this.HEADER_HEIGHT)
      .strokeColor('black')
      .stroke();
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ALLIANCE PHARMA', this.MARGINS + 10, headerTop + 10, {
      width: sectionWidth - 20,
      align: 'center',
    });
    doc.fontSize(8).font('Helvetica');
    doc.text('Tel: 80130610', this.MARGINS + 10, headerTop + 25, {
      width: sectionWidth - 20,
      align: 'center',
    });
    doc.text(
      'RCCM: NE/NIM/01/2024/B14/00004',
      this.MARGINS + 10,
      headerTop + 35,
      {
        width: sectionWidth - 20,
        align: 'center',
      },
    );
    doc.text('NIF: 37364/R', this.MARGINS + 10, headerTop + 45, {
      width: sectionWidth - 20,
      align: 'center',
    });
    doc.text('BP: 11807', this.MARGINS + 10, headerTop + 55, {
      width: sectionWidth - 20,
      align: 'center',
    });
    doc.text('Adresse: NIAMEY', this.MARGINS + 10, headerTop + 65, {
      width: sectionWidth - 20,
      align: 'center',
    });

    // Section 2: Logo
    doc
      .rect(
        this.MARGINS + sectionWidth,
        headerTop,
        sectionWidth,
        this.HEADER_HEIGHT,
      )
      .strokeColor('black')
      .stroke();
    try {
      doc.image(
        'src/uploads/rmlogo.png',
        this.MARGINS + sectionWidth + (sectionWidth - 90) / 2,
        headerTop + 10,
        {
          width: 90,
        },
      );
    } catch (error) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('LOGO', this.MARGINS + sectionWidth + 10, headerTop + 40, {
          width: sectionWidth - 20,
          align: 'center',
        });
    }

    // Section 3: FACTURE PROFORMA
    doc
      .rect(
        this.MARGINS + 2 * sectionWidth,
        headerTop,
        sectionWidth,
        this.HEADER_HEIGHT,
      )
      .strokeColor('black')
      .stroke();
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0066CC');
    doc.text(
      'FACTURE PROFORMA',
      this.MARGINS + 2 * sectionWidth + 10,
      headerTop + 10,
      {
        width: sectionWidth - 20,
        align: 'center',
      },
    );
    doc.fillColor('black');
    doc.fontSize(8).font('Helvetica');
    doc.text(
      `N° ${sanitizeString(proformat.id_commande_vente.toString())}`,
      this.MARGINS + 2 * sectionWidth + 10,
      headerTop + 30,
      { width: sectionWidth - 20, align: 'center' },
    );
    doc.text(
      `Date: ${formatDate(proformat.date_commande_vente)}`,
      this.MARGINS + 2 * sectionWidth + 10,
      headerTop + 45,
      {
        width: sectionWidth - 20,
        align: 'center',
      },
    );

    // Séparateurs verticaux
    doc
      .moveTo(this.MARGINS + sectionWidth, headerTop)
      .lineTo(this.MARGINS + sectionWidth, headerTop + this.HEADER_HEIGHT)
      .stroke();
    doc
      .moveTo(this.MARGINS + 2 * sectionWidth, headerTop)
      .lineTo(this.MARGINS + 2 * sectionWidth, headerTop + this.HEADER_HEIGHT)
      .stroke();

    // Ligne de séparation sous l'en-tête
    const separatorY = headerTop + this.HEADER_HEIGHT + 10;
    doc
      .moveTo(this.MARGINS, separatorY)
      .lineTo(this.PAGE_WIDTH - this.MARGINS, separatorY)
      .stroke();

    // Informations utilisateur et client
    const infoTop = separatorY + 15;
    doc.fontSize(8).font('Helvetica');

    doc.text(
      `Login: ${sanitizeString(proformat.login)}`,
      this.MARGINS,
      infoTop,
    );

    const clientX = this.MARGINS + 300;
    doc.text(
      `Client: ${sanitizeString(proformat.client?.nom || 'N/A')}`,
      clientX,
      infoTop,
    );
    doc.text(
      `NIF: ${sanitizeString(proformat.client?.nif || 'N/A')}`,
      clientX,
      infoTop + 12,
    );
    doc.text(
      `Adresse: ${sanitizeString(proformat.client?.adresse || 'N/A')}`,
      clientX,
      infoTop + 24,
    );
    doc.text(
      `Téléphone: ${sanitizeString(proformat.client?.telephone || 'N/A')}`,
      clientX,
      infoTop + 36,
    );

    return infoTop + 55;
  }

  private drawFullProforma(doc: PDFDocument, proformat: any): void {
    const tableTop = this.drawProformaHeader(doc, proformat);
    const tableLeft = this.MARGINS;
    const columnWidths = [220, 70, 80, 90, 80];

    // En-tête du tableau
    this.drawTableHeader(doc, tableTop, tableLeft, columnWidths, [
      'Désignation',
      'Qté',
      'P.U.',
      'Expiration',
      'Montant',
    ]);

    // Lignes du tableau
    let y = tableTop + 25;
    let subtotal = 0;

    doc.fontSize(8).font('Helvetica');

    proformat.lignes.forEach((ligne: any) => {
      if (y + this.ROW_HEIGHT > this.MAX_Y - 100) {
        doc.addPage();
        const newTableTop = this.drawProformaHeader(doc, proformat);
        this.drawTableHeader(doc, newTableTop, tableLeft, columnWidths, [
          'Désignation',
          'Qté',
          'P.U.',
          'Expiration',
          'Montant',
        ]);
        y = newTableTop + 25;
      }

      const totalLigne = ligne.prix_vente * ligne.quantite;
      subtotal += totalLigne;

      let x = tableLeft;

      // Bordure verticale de début
      doc
        .moveTo(tableLeft, y)
        .lineTo(tableLeft, y + this.ROW_HEIGHT)
        .stroke();

      // Désignation
      const designation = sanitizeString(
        ligne.produit?.produit || ligne.designation?.toString() || 'N/A',
      );
      doc.text(designation.substring(0, 35), x + 5, y + 5, {
        width: columnWidths[0] - 10,
        align: 'left',
      });
      x += columnWidths[0];

      doc
        .moveTo(x, y)
        .lineTo(x, y + this.ROW_HEIGHT)
        .stroke();

      // Quantité
      doc.text(ligne.quantite.toString(), x + 5, y + 5, {
        width: columnWidths[1] - 10,
        align: 'center',
      });
      x += columnWidths[1];

      doc
        .moveTo(x, y)
        .lineTo(x, y + this.ROW_HEIGHT)
        .stroke();

      // Prix unitaire (arrondi)
      doc.text(Math.round(ligne.prix_vente || 0).toString(), x + 5, y + 5, {
        width: columnWidths[2] - 10,
        align: 'right',
      });
      x += columnWidths[2];

      doc
        .moveTo(x, y)
        .lineTo(x, y + this.ROW_HEIGHT)
        .stroke();

      // Date d'expiration
      const dateExp = ligne.produit?.validite_amm
        ? new Date(ligne.produit.validite_amm).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })
        : 'N/A';
      doc.text(dateExp, x + 5, y + 5, {
        width: columnWidths[3] - 10,
        align: 'center',
      });
      x += columnWidths[3];

      doc
        .moveTo(x, y)
        .lineTo(x, y + this.ROW_HEIGHT)
        .stroke();

      // Montant total ligne (arrondi)
      doc.text(Math.round(totalLigne).toString(), x + 5, y + 5, {
        width: columnWidths[4] - 10,
        align: 'right',
      });
      x += columnWidths[4];

      // Bordure verticale de fin
      doc
        .moveTo(x, y)
        .lineTo(x, y + this.ROW_HEIGHT)
        .stroke();

      // Bordure horizontale sous la ligne
      doc
        .moveTo(tableLeft, y + this.ROW_HEIGHT)
        .lineTo(
          tableLeft + columnWidths.reduce((a, b) => a + b, 0),
          y + this.ROW_HEIGHT,
        )
        .stroke();

      y += this.ROW_HEIGHT;
    });

    // Résumé financier
    const summaryTop = y + 20;
    if (summaryTop > this.MAX_Y - 200) {
      doc.addPage();
      this.drawProformaFinancialSummary(doc, 40, proformat);
    } else {
      this.drawProformaFinancialSummary(doc, summaryTop, proformat);
    }
  }

  private drawSimpleProforma(doc: PDFDocument, proformat: any): void {
    const tableTop = 110;
    const tableLeft = 50;
    const columnWidths = [250, 50, 70, 80];

    // En-tête du tableau
    this.drawTableHeader(doc, tableTop, tableLeft, columnWidths, [
      'Désignation',
      'Qté',
      'P.U.',
      'Total',
    ]);

    // Lignes
    let y = tableTop + 30;
    let subtotal = 0;

    doc.fontSize(8).font('Helvetica');

    proformat.lignes.forEach((ligne: any) => {
      if (y + this.ROW_HEIGHT > this.MAX_Y) {
        doc.addPage();
        y = 40;
        this.drawTableHeader(doc, y, tableLeft, columnWidths, [
          'Désignation',
          'Qté',
          'P.U.',
          'Total',
        ]);
        y += 30;
      }

      const totalLigne = ligne.prix_vente * ligne.quantite;
      subtotal += totalLigne;

      let x = tableLeft;
      const designation = sanitizeString(
        ligne.produit?.produit || ligne.designation?.toString() || 'N/A',
      );
      doc.text(designation.substring(0, 40), x, y, {
        width: columnWidths[0],
        align: 'left',
      });
      x += columnWidths[0];

      doc.text(ligne.quantite.toString(), x, y, {
        width: columnWidths[1],
        align: 'center',
      });
      x += columnWidths[1];

      doc.text(Math.round(ligne.prix_vente || 0).toString(), x, y, {
        width: columnWidths[2],
        align: 'right',
      });
      x += columnWidths[2];

      doc.text(Math.round(totalLigne).toString(), x, y, {
        width: columnWidths[3],
        align: 'right',
      });

      y += this.ROW_HEIGHT;
    });

    doc
      .moveTo(tableLeft, y)
      .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y)
      .stroke();

    // Résumé simplifié
    const summaryTop = y + 20 > this.MAX_Y ? (doc.addPage(), 40) : y + 20;
    this.drawSimpleProformaSummary(doc, summaryTop, proformat);
  }

  private formatCurrency(amount: number): string {
    return Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  private drawProformaFinancialSummary(
    doc: PDFDocument,
    summaryTop: number,
    proformat: any,
  ): void {
    const montantHT = proformat.lignes.reduce(
      (sum: number, ligne: any) => sum + ligne.prix_vente * ligne.quantite,
      0,
    );
    const remise = Number(proformat.remise || 0);
    const montantNetHT = montantHT - remise;
    const timbreFiscal = 200;
    const tva = Number(proformat.tva || 0);
    const isb = Number(proformat.isb || 0);
    const totalTTC = montantNetHT + tva + isb + timbreFiscal;

    // Titre
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
    doc.text('RÉSUMÉ FINANCIER', this.MARGINS, summaryTop);
    doc.fillColor('black');

    // Ligne de séparation
    doc
      .moveTo(this.MARGINS, summaryTop + 15)
      .lineTo(this.PAGE_WIDTH - this.MARGINS, summaryTop + 15)
      .stroke();

    let currentY = summaryTop + 25;
    doc.fontSize(9).font('Helvetica');

    // Montant HT initial
    doc.text('Montant HT:', this.MARGINS, currentY);
    doc.text(
      `${this.formatCurrency(montantHT)} CFA`,
      this.PAGE_WIDTH - this.MARGINS - 100,
      currentY,
      { align: 'right' },
    );
    currentY += 15;

    // Timbre fiscal
    doc.text('Timbre Fiscal:', this.MARGINS, currentY);
    doc.text(
      `${this.formatCurrency(timbreFiscal)} CFA`,
      this.PAGE_WIDTH - this.MARGINS - 100,
      currentY,
      { align: 'right' },
    );
    currentY += 15;

    // Remise (si > 0)
    if (remise > 0) {
      doc.text('Remise:', this.MARGINS, currentY);
      doc.text(
        `-${this.formatCurrency(remise)} CFA`,
        this.PAGE_WIDTH - this.MARGINS - 100,
        currentY,
        { align: 'right' },
      );
      currentY += 15;

      doc.text('Net HT:', this.MARGINS, currentY);
      doc.text(
        `${this.formatCurrency(montantNetHT)} CFA`,
        this.PAGE_WIDTH - this.MARGINS - 100,
        currentY,
        { align: 'right' },
      );
      currentY += 15;
    }

    // ISB/Précompte
    if (isb > 0) {
      const baseCalculIsb = montantNetHT + timbreFiscal;
      const tauxISB =
        baseCalculIsb > 0 ? ((isb / baseCalculIsb) * 100).toFixed(0) : '0';
      doc.text(`ISB/Précompte (${tauxISB}%):`, this.MARGINS, currentY);
      doc.text(
        `${this.formatCurrency(isb)} CFA`,
        this.PAGE_WIDTH - this.MARGINS - 100,
        currentY,
        { align: 'right' },
      );
      currentY += 15;
    }

    // TVA (si > 0)
    if (tva > 0) {
      const tauxTVA =
        montantNetHT > 0 ? ((tva / montantNetHT) * 100).toFixed(0) : '0';
      doc.text(`TVA (${tauxTVA}%):`, this.MARGINS, currentY);
      doc.text(
        `${this.formatCurrency(tva)} CFA`,
        this.PAGE_WIDTH - this.MARGINS - 100,
        currentY,
        { align: 'right' },
      );
      currentY += 15;
    }

    currentY += 5;

    // Ligne de séparation avant total
    doc
      .moveTo(this.MARGINS, currentY)
      .lineTo(this.PAGE_WIDTH - this.MARGINS, currentY)
      .stroke();
    currentY += 10;

    // Total TTC (en gras avec couleur)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0066CC');
    doc.text('MONTANT TOTAL TTC:', this.MARGINS, currentY);
    doc.text(
      `${this.formatCurrency(totalTTC)} CFA`,
      this.PAGE_WIDTH - this.MARGINS - 100,
      currentY,
      { align: 'right' },
    );
    doc.fillColor('black');
    currentY += 25;

    // Informations complémentaires
    doc.fontSize(8).font('Helvetica');
    doc.text(
      `Nombre d'articles: ${proformat.lignes.length}`,
      this.MARGINS,
      currentY,
    );
    currentY += 12;
    doc.text('* Montants en francs CFA', this.MARGINS, currentY);
    currentY += 20;

    // Note importante pour proforma
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#666666');
    doc.text(
      "Cette facture proforma est valable 30 jours à compter de sa date d'émission.",
      this.MARGINS,
      currentY,
      { width: this.PAGE_WIDTH - 2 * this.MARGINS, align: 'center' },
    );
    currentY += 15;
    doc.text(
      "Elle ne constitue pas une facture définitive et n'a aucune valeur comptable.",
      this.MARGINS,
      currentY,
      { width: this.PAGE_WIDTH - 2 * this.MARGINS, align: 'center' },
    );
    doc.fillColor('black');
    currentY += 25;

    // Signature
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Le Gestionnaire', this.MARGINS, currentY, { underline: true });

    // Ligne finale
    doc
      .moveTo(this.MARGINS, currentY + 20)
      .lineTo(this.PAGE_WIDTH - this.MARGINS, currentY + 20)
      .stroke();
  }

  private drawSimpleProformaSummary(
    doc: PDFDocument,
    summaryTop: number,
    proformat: any,
  ): void {
    const montantHT = proformat.lignes.reduce(
      (sum: number, ligne: any) => sum + ligne.prix_vente * ligne.quantite,
      0,
    );
    const remise = Number(proformat.remise || 0);
    const montantNetHT = montantHT - remise;
    const timbreFiscal = 200;
    const tva = Number(proformat.tva || 0);
    const isb = Number(proformat.isb || 0);
    const totalTTC = montantNetHT + tva + isb + timbreFiscal;

    let y = summaryTop;
    doc.fontSize(9).font('Helvetica');

    doc.text(`Montant HT: ${this.formatCurrency(montantHT)} CFA`, 350, y, {
      align: 'right',
    });

    if (remise > 0) {
      y += 15;
      doc.text(`Remise: -${this.formatCurrency(remise)} CFA`, 350, y, {
        align: 'right',
      });
    }

    y += 15;
    doc.text(`Timbre: ${this.formatCurrency(timbreFiscal)} CFA`, 350, y, {
      align: 'right',
    });

    if (tva > 0) {
      y += 15;
      doc.text(`TVA: ${this.formatCurrency(tva)} CFA`, 350, y, {
        align: 'right',
      });
    }

    if (isb > 0) {
      y += 15;
      doc.text(`ISB: ${this.formatCurrency(isb)} CFA`, 350, y, {
        align: 'right',
      });
    }

    y += 20;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0066CC');
    doc.text(`TOTAL TTC: ${this.formatCurrency(totalTTC)} CFA`, 350, y, {
      align: 'right',
    });
    doc.fillColor('black');

    y += 25;
    doc.fontSize(8).font('Helvetica-Oblique');
    doc.text('Proforma valable 30 jours - Sans valeur comptable', 50, y, {
      width: 500,
      align: 'center',
    });
  }

  private drawTableHeader(
    doc: PDFDocument,
    tableTop: number,
    tableLeft: number,
    columnWidths: number[],
    headers: string[],
  ): void {
    doc.fontSize(10).font('Helvetica-Bold');
    let x = tableLeft;
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
  }

  async findAllByYear(
    year: number = new Date().getFullYear(),
  ): Promise<Proformat[]> {
    console.log('Filtre par année:', { year });

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Année invalide');
    }

    try {
      const proformats = await this.proformatRepository.find({
        where: { date_commande_vente: Between(startDate, endDate) },
        relations: ['client'],
        order: {
          date_commande_vente: 'DESC', // Trier par date_commande_vente, plus récent en premier
        },
      });
      console.log(
        "Proformats trouvés pour l'année:",
        JSON.stringify(proformats, null, 2),
      );
      return proformats;
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des proformats par année:',
        JSON.stringify(error, null, 2),
      );
      throw new BadRequestException(
        'Erreur lors de la récupération des proformats par année',
      );
    }
  }
}
