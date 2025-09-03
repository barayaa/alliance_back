import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAvoirDto } from './dto/create-avoir.dto';
import { UpdateAvoirDto } from './dto/update-avoir.dto';
import { Avoir } from './entities/avoir.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { Client } from 'src/client/client.entity';
import { Produit } from 'src/produit/produit.entity';
import { Isb } from 'src/isb/isb.entity';
import { TypeReglement } from 'src/type_reglement/type_reglement.entity';
import { CommandeVente } from 'src/commande_vente/commande_vente.entity';
import { MMvtStock } from 'src/m_mvt_stock/m_mvt_stock.entity';
import { CaptureStockService } from 'src/capture_stock/capture_stock.service';
import { LigneAvoir } from 'src/ligne_avoir/entities/ligne_avoir.entity';
import { Log } from 'src/log/log.entity';
import { LignesCommandeVente } from 'src/lignes_commande_vente/lignes_commande_vente.entity';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { GetAvoirsDto } from './dto/get-avoir.dto';
import Table from 'pdfkit-table';

import * as PDFDocument from 'pdfkit';

function sanitizeString(str: string | null | undefined): string {
  return (str || 'N/A').replace(/[^\w\s-]/g, '');
}

function numberToWordsFr(number: number): string {
  // Placeholder : à remplacer par une vraie implémentation
  const units = [
    'zéro',
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
  if (number < 10) return units[number];
  if (number < 100) {
    const unit = number % 10;
    const ten = Math.floor(number / 10);
    return `${tens[ten]}${unit ? '-' + units[unit] : ''}`;
  }
  return number.toString() + ' francs CFA'; // À remplacer par une implémentation complète
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
export class AvoirService {
  constructor(
    @InjectRepository(Avoir)
    private avoirRepository: Repository<Avoir>,
    @InjectRepository(LigneAvoir)
    private lignesAvoirRepository: Repository<LigneAvoir>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(Isb)
    private isbRepository: Repository<Isb>,
    @InjectRepository(TypeReglement)
    private typeReglementRepository: Repository<TypeReglement>,
    @InjectRepository(CommandeVente)
    private commandeVenteRepository: Repository<CommandeVente>,
    @InjectRepository(MMvtStock)
    private mvtStockRepository: Repository<MMvtStock>,
    private captureStockService: CaptureStockService,
  ) {}

  findAll() {
    return this.avoirRepository.find({
      relations: {
        lignes: true,
        facture_vente: true,
        client: true,
      },
    });
  }

  findOne(id: number) {
    return this.avoirRepository.findOne({
      where: { id_avoir: id },
      relations: {
        lignes: true,
        facture_vente: true,
        client: true,
      },
    });
  }

  async createAvoir(dto: CreateAvoirDto): Promise<Avoir> {
    // console.log('Payload reçu pour avoir:', JSON.stringify(dto, null, 2));

    // Validation des champs
    if (
      !dto.login ||
      typeof dto.login !== 'string' ||
      dto.login.trim() === ''
    ) {
      throw new BadRequestException(
        'Le champ login est requis et doit être une chaîne non vide',
      );
    }

    return this.avoirRepository.manager.transaction(async (manager) => {
      try {
        // Valider la facture de vente initiale
        const factureVente = await manager.findOne(CommandeVente, {
          where: {
            id_commande_vente: dto.id_facture_vente,
            type_facture: 'FV',
          },
          relations: ['client', 'lignes', 'lignes.produit'],
        });
        if (!factureVente) {
          throw new BadRequestException(
            `Facture de vente avec id ${dto.id_facture_vente} non trouvée`,
          );
        }

        // Valider le client
        const client = await manager.findOneBy(Client, {
          id_client: dto.id_client,
        });
        if (!client || client.id_client !== factureVente.id_client) {
          throw new BadRequestException(
            `Client ${dto.id_client} non valide ou ne correspond pas à la facture`,
          );
        }

        // Valider type_isb
        const isbs = await manager.find(Isb, { select: ['isb'] });
        const validIsb = isbs.map((isb) => isb.isb.trim().toUpperCase());
        const isbMapping: { [key: string]: string } = {
          A: '0%',
          C: '2%',
          D: '5%',
        };
        const mappedTypeIsb =
          isbMapping[dto.type_isb?.toUpperCase()] ||
          dto.type_isb?.toUpperCase();
        if (!dto.type_isb || !validIsb.includes(mappedTypeIsb)) {
          throw new BadRequestException(
            `Type ISB invalide: ${dto.type_isb}. Valeurs valides: ${validIsb.join(', ')}`,
          );
        }
        const isbRecord = await manager.findOne(Isb, {
          where: { isb: mappedTypeIsb },
        });
        const isbRate: any = isbRecord?.taux || 0;

        // Valider type_reglement
        const typeReglements = await manager.find(TypeReglement);
        const validTypeReglements = typeReglements.map((tr) =>
          tr.type_reglement.trim().toUpperCase(),
        );
        const receivedTypeReglement = dto.type_reglement?.toUpperCase() || 'E';
        if (!validTypeReglements.includes(receivedTypeReglement)) {
          throw new BadRequestException(
            `Type de règlement invalide: ${dto.type_reglement}. Valeurs valides: ${validTypeReglements.join(', ')}`,
          );
        }

        // Valider la remise globale
        if (dto.remise == null || isNaN(dto.remise) || dto.remise < 0) {
          throw new BadRequestException(
            `Remise invalide: ${dto.remise}. Doit être un nombre positif en CFA`,
          );
        }

        // Générer numero_seq et numero_facture_certifiee
        const currentYear = new Date().getFullYear();
        const lastAvoir = await manager.findOne(Avoir, {
          where: { numero_facture_certifiee: Like(`%-${currentYear}`) },
          order: { numero_seq: 'DESC' },
        });
        const numero_seq = lastAvoir ? lastAvoir.numero_seq + 1 : 1;
        const numero_facture_certifiee = `${numero_seq.toString().padStart(4, '0')}-${currentYear}`;

        // Vérifier l'unicité
        const existingAvoir = await manager.findOne(Avoir, {
          where: { numero_facture_certifiee },
        });
        if (existingAvoir) {
          throw new BadRequestException(
            `Une facture d'avoir existe déjà avec le numéro ${numero_facture_certifiee}`,
          );
        }

        // Créer l'avoir
        const avoir = manager.create(Avoir, {
          date_avoir: new Date(dto.date_avoir || new Date()),
          montant_total: 0,
          montant_restant: 0,
          remise: dto.remise || 0,
          validee: 1,
          statut: 0,
          id_client: dto.id_client,
          client,
          reglee: 0,
          moyen_reglement: 0,
          type_reglement: receivedTypeReglement,
          tva: 0,
          type_isb: dto.type_isb,
          isb: 0,
          login: dto.login,
          ref_ini: factureVente.numero_facture_certifiee,
          facture_vente: factureVente,
          numero_seq,
          numero_facture_certifiee,
          imprimee: 1,
          certifiee: 'NON',
          commentaire1:
            dto.commentaire1 ||
            `Avoir pour facture ${factureVente.id_commande_vente}`,
          commentaire2: dto.commentaire2 || '',
          commentaire3: dto.commentaire3 || '',
          commentaire4: dto.commentaire4 || '',
          commentaire5: dto.commentaire5 || '',
          commentaire6: dto.commentaire6 || '',
          commentaire7: dto.commentaire7 || '',
          commentaire8: dto.commentaire8 || '',
        });

        const savedAvoir = await manager.save(Avoir, avoir);

        // Calculer les lignes de l'avoir et mettre à jour les lignes de la facture initiale
        let subtotal = 0;
        let montant_tva = 0;
        let isb_total = 0;
        const savedLignes: LigneAvoir[] = [];

        for (const ligne of dto.lignes) {
          // Vérifier que le produit existe dans la facture initiale
          const ligneOriginale = factureVente.lignes.find(
            (l) => l.designation === ligne.id_produit,
          );
          if (!ligneOriginale) {
            throw new BadRequestException(
              `Produit ${ligne.id_produit} non présent dans la facture initiale`,
            );
          }
          // Vérifier que la quantité demandée dans l'avoir ne dépasse pas la quantité initiale
          if (ligne.quantite > ligneOriginale.quantite) {
            throw new BadRequestException(
              `Quantité ${ligne.quantite} pour produit ${ligne.id_produit} dépasse la quantité initiale ${ligneOriginale.quantite}`,
            );
          }

          // Vérifier que le produit existe
          const produit = await manager.findOneBy(Produit, {
            id_produit: ligne.id_produit,
          });
          if (!produit) {
            throw new BadRequestException(
              `Produit avec id ${ligne.id_produit} non trouvé`,
            );
          }

          // Utiliser la remise de la facture initiale si aucune remise spécifique n'est fournie
          const prix_vente = ligneOriginale.prix_vente;
          const remise = ligne.remise ?? ligneOriginale.remise;
          if (remise < 0 || remise > 1) {
            throw new BadRequestException(
              `Remise pour produit ${ligne.id_produit} invalide: ${remise}. Doit être entre 0 et 1`,
            );
          }

          // Calculer le montant de la ligne d'avoir
          const montant_ligne = prix_vente * ligne.quantite * (1 - remise);
          const taux_tva = ligneOriginale.taux_tva;
          const montant_tva_ligne = montant_ligne * (taux_tva / 100);
          const isb_ligne = ligne.isb_ligne ?? montant_ligne * isbRate;

          // Vérifier que le montant de la ligne ne dépasse pas le montant initial
          const montant_ligne_initial =
            ligneOriginale.prix_vente *
            ligneOriginale.quantite *
            (1 - ligneOriginale.remise);
          if (montant_ligne > montant_ligne_initial) {
            throw new BadRequestException(
              `Le montant de la ligne pour le produit ${ligne.id_produit} (${montant_ligne}) dépasses le montant initial (${montant_ligne_initial})`,
            );
          }

          // Cumuler les montants pour l'avoir
          subtotal += montant_ligne;
          montant_tva += montant_tva_ligne;
          isb_total += isb_ligne;

          // Créer la ligne d'avoir
          const ligneAvoir = manager.create(LigneAvoir, {
            id_avoir: savedAvoir.id_avoir,
            avoir: savedAvoir,
            designation: ligne.id_produit,
            produit,
            prix_vente,
            remise,
            description_remise: ligne.description_remise || 'Avoir',
            prix_vente_avant_remise: prix_vente.toString(),
            quantite: ligne.quantite,
            montant: montant_ligne,
            group_tva: ligneOriginale.group_tva,
            etiquette_tva: ligneOriginale.etiquette_tva,
            taux_tva,
            montant_tva: montant_tva_ligne,
            isb_ligne,
            date: dto.date_avoir || new Date().toISOString().split('T')[0],
            stock_avant: produit.stock_courant,
            stock_apres: produit.stock_courant + ligne.quantite,
            retour: 0,
          });

          const savedLigne = await manager.save(LigneAvoir, ligneAvoir);
          savedLignes.push(savedLigne);

          // Mettre à jour la ligne correspondante dans la facture initiale
          const nouvelleQuantite = ligneOriginale.quantite - ligne.quantite;
          const nouveauMontantLigne =
            prix_vente * nouvelleQuantite * (1 - remise);
          const nouveauMontantTvaLigne = nouveauMontantLigne * (taux_tva / 100);

          await manager.update(
            LignesCommandeVente,
            { id_ligne_commande_vente: ligneOriginale.id_ligne_commande_vente },
            {
              quantite: nouvelleQuantite,
              montant: nouveauMontantLigne,
              montant_tva: nouveauMontantTvaLigne,
            },
          );

          // Restaurer le stock
          await manager.update(
            Produit,
            { id_produit: ligne.id_produit },
            { stock_courant: produit.stock_courant + ligne.quantite },
          );

          // Enregistrer le mouvement de stock
          const mvtStock = manager.create(MMvtStock, {
            id_produit: ligne.id_produit,
            quantite: ligne.quantite,
            quantite_commandee: 0,
            cout: produit.prix_unitaire || 0,
            date: new Date(),
            user: dto.login.trim(),
            type: 1,
            magasin: 1,
            commentaire: `Retour via avoir ${savedAvoir.id_avoir}`,
            stock_avant: produit.stock_courant,
            stock_apres: produit.stock_courant + ligne.quantite,
            id_commande_vente: factureVente.id_commande_vente,
            annule: 'N',
            num_lot: '',
            date_expiration: null,
            conformite: 'O',
          });
          await manager.save(MMvtStock, mvtStock);

          // Mettre à jour le stock capturé
          await this.captureStockService.updateStockCapture(
            ligne.id_produit,
            produit.stock_courant + ligne.quantite,
          );
        }

        // Calculer le montant total de l'avoir
        const montant_total_avoir = subtotal + montant_tva + isb_total;
        const remise_globale = dto.remise || 0;

        // Vérifier que la remise globale est valide
        if (remise_globale > montant_total_avoir) {
          throw new BadRequestException(
            `La remise globale (${remise_globale}) dépasse le montant total de l'avoir (${montant_total_avoir})`,
          );
        }

        const montant_final_avoir = montant_total_avoir - remise_globale;

        // Vérifier que l'avoir ne dépasse pas le montant total initial de la facture
        if (montant_final_avoir > factureVente.montant_total) {
          throw new BadRequestException(
            `Le montant de l'avoir (${montant_final_avoir}) dépasse le montant total initial de la facture (${factureVente.montant_total})`,
          );
        }

        // Mettre à jour l'avoir avec les montants calculés
        await manager.update(
          Avoir,
          { id_avoir: savedAvoir.id_avoir },
          {
            montant_total: montant_final_avoir,
            montant_restant: montant_final_avoir,
            tva: montant_tva,
            isb: isb_total,
          },
        );

        // Recalculer le montant total de la facture initiale après modification des lignes
        const lignesFacture = await manager.find(LignesCommandeVente, {
          where: { id_commande_vente: factureVente.id_commande_vente },
          select: ['montant', 'montant_tva'],
        });
        const nouveauMontantTotalFacture = lignesFacture.reduce(
          (sum, ligne) => sum + ligne.montant + ligne.montant_tva,
          0,
        );

        // Calculer le montant déjà payé et le nouveau montant restant
        const montantDejaPaye =
          factureVente.montant_total - factureVente.montant_restant;
        let nouveauMontantRestant =
          nouveauMontantTotalFacture - montantDejaPaye;

        // Gérer le cas où le client a payé plus que le nouveau montant total
        let surplus = 0;
        if (nouveauMontantRestant < 0) {
          surplus = Math.abs(nouveauMontantRestant);
          nouveauMontantRestant = 0;
        }

        // Mettre à jour la facture initiale avec les nouveaux montants
        await manager.update(
          CommandeVente,
          { id_commande_vente: factureVente.id_commande_vente },
          {
            montant_total: nouveauMontantTotalFacture,
            montant_restant: nouveauMontantRestant,
            avoir: 1,
          },
        );

        // Si surplus, créditer l'avance du client
        if (surplus > 0) {
          const client = await manager.findOneBy(Client, {
            id_client: factureVente.id_client,
          });
          if (client) {
            const nouveauSolde = (client.avance || 0) + surplus;
            await manager.update(
              Client,
              { id_client: factureVente.id_client },
              { avance: nouveauSolde },
            );
            console.log(
              `Solde du client ${client.nom} mis à jour : avance = ${nouveauSolde}`,
            );
          }
        }

        // Enregistrer le log de l'opération
        const logEntry = manager.create(Log, {
          log: `Enregistrement de la facture d'avoir N° ${savedAvoir.id_avoir} pour facture ${factureVente.numero_facture_certifiee} (montant: ${montant_final_avoir}, nouveau montant facture: ${nouveauMontantTotalFacture}, surplus crédité: ${surplus})`,
          date: new Date(),
          user: dto.login.trim(),
          archive: 1,
        });
        await manager.save(Log, logEntry);

        // Recharger l'avoir avec toutes les relations pour le retour
        const finalAvoir = await manager.findOne(Avoir, {
          where: { id_avoir: savedAvoir.id_avoir },
          relations: ['client', 'facture_vente', 'lignes', 'lignes.produit'],
        });

        return finalAvoir;
      } catch (error) {
        console.error(
          'Erreur dans la transaction:',
          JSON.stringify(error, null, 2),
        );
        throw error;
      }
    });
  }

  async getAvoirs(dto: GetAvoirsDto): Promise<Avoir[]> {
    console.log('getAvoirs called with:', dto);

    const where: any = {};
    if (dto.id_client != null) {
      const client = await this.clientRepository.findOne({
        where: { id_client: dto.id_client },
      });
      if (!client) {
        console.warn('Client non trouvé:', dto.id_client);
        throw new NotFoundException(
          `Client avec ID ${dto.id_client} non trouvé`,
        );
      }
      where.id_client = dto.id_client;
    }
    if (dto.date_debut && dto.date_fin) {
      where.date_avoir = Between(
        new Date(dto.date_debut),
        new Date(dto.date_fin),
      );
    } else if (dto.date_debut) {
      where.date_avoir = Between(new Date(dto.date_debut), new Date());
    } else if (dto.date_fin) {
      where.date_avoir = Between(new Date(0), new Date(dto.date_fin));
    }

    const avoirs = await this.avoirRepository.find({
      where,
      relations: ['client', 'facture_vente', 'lignes', 'lignes.produit'],
      order: { date_avoir: 'DESC' },
    });

    console.log('getAvoirs: Avoirs récupérés:', avoirs);
    return avoirs;
  }

  async exportAvoirsToExcel(dto: GetAvoirsDto, res: Response): Promise<void> {
    try {
      // Récupérer les avoirs (tous si id_client est absent)
      const avoirs = await this.getAvoirs(dto); // On suppose que getAvoirs gère l'absence de id_client
      if (!avoirs || avoirs.length === 0) {
        throw new NotFoundException('Aucun avoir trouvé');
      }

      // Créer un nouveau classeur Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Avoirs');

      // Définir les colonnes
      worksheet.columns = [
        { header: 'ID Avoir', key: 'id_avoir', width: 15 },
        {
          header: 'Numéro Facture Avoir',
          key: 'numero_facture_certifiee',
          width: 20,
        },
        { header: 'Date', key: 'date_avoir', width: 20 },
        { header: 'Client', key: 'client_nom', width: 30 },
        { header: 'Montant Total (FCFA)', key: 'montant_total', width: 20 },
        { header: 'Montant Restant (FCFA)', key: 'montant_restant', width: 20 },
        { header: 'Commentaire', key: 'commentaire1', width: 40 },
      ];

      // Ajouter les données
      avoirs.forEach((avoir) => {
        worksheet.addRow({
          id_avoir: avoir.id_avoir,
          numero_facture_certifiee: avoir.numero_facture_certifiee,
          date_avoir: avoir.date_avoir
            ? new Date(avoir.date_avoir).toLocaleDateString('fr-FR')
            : '',
          client_nom:
            `${avoir.client?.nom || 'Inconnu'} ${avoir.client?.prenom || ''}`.trim(),
          montant_total: Number(avoir.montant_total || 0).toFixed(2),
          montant_restant: Number(avoir.montant_restant || 0).toFixed(2),
          commentaire1: avoir.commentaire1 || '',
        });
      });

      // Définir les en-têtes HTTP
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=avoirs${dto.id_client ? `_client_${dto.id_client}` : ''}_${new Date().toISOString().split('T')[0]}.xlsx`,
      );

      // Écrire le fichier Excel dans la réponse
      await workbook.xlsx.write(res);
      // Ne pas appeler res.end() ici, car workbook.xlsx.write termine la réponse
    } catch (error) {
      console.error("Erreur lors de l'exportation Excel:", error);
      throw new InternalServerErrorException(
        `Erreur lors de l'exportation des avoirs: ${error.message}`,
      );
    }
  }

  async printAvoirToPdf(
    id: number | string,
    res: Response,
    type: 'full' | 'simple' = 'full',
  ): Promise<void> {
    try {
      // Convertir et valider l'ID
      const avoirId = Number(id);
      if (isNaN(avoirId) || !Number.isInteger(avoirId) || avoirId <= 0) {
        throw new BadRequestException("ID de l'avoir invalide");
      }

      // Récupérer l'avoir avec les relations nécessaires
      const avoir = await this.avoirRepository.findOne({
        where: { id_avoir: avoirId },
        relations: ['client', 'lignes', 'lignes.produit', 'facture_vente'],
      });

      if (!avoir || !avoir.facture_vente) {
        throw new NotFoundException(
          `Avoir avec id ${avoirId} ou facture liée non trouvé`,
        );
      }

      // Filtrer les lignes corrigées (quantite !== 0 et montant !== 0)
      const correctedLignes =
        avoir.lignes?.filter(
          (ligne) => ligne.quantite !== 0 && ligne.montant !== 0,
        ) || [];

      // Corriger commentaire1 si nécessaire
      const correctedCommentaire1 = avoir.commentaire1?.startsWith(
        'Avoir pour facture',
      )
        ? `Avoir pour facture ${sanitizeString(avoir.facture_vente.id_commande_vente.toString())}`
        : avoir.commentaire1;

      console.log('Avoir récupéré:', JSON.stringify(avoir, null, 2));
      console.log(
        'Lignes corrigées:',
        JSON.stringify(correctedLignes, null, 2),
      );
      console.log('Commentaire1 corrigé:', correctedCommentaire1);

      // Créer un nouveau document PDF
      const doc = new PDFDocument({ size: 'A4', margin: 40 });

      // Configurer les en-têtes HTTP
      res.setHeader('Content-Type', 'application/pdf');
      const filename = `avoir_${sanitizeString(avoir.facture_vente.id_commande_vente.toString())}_${type}.pdf`;
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      // Gérer les erreurs du flux
      doc.on('error', (err) => {
        console.error('Erreur dans le flux PDF:', err);
        if (!res.headersSent) {
          res
            .status(500)
            .json({ message: 'Erreur lors de la génération du PDF' });
        }
      });

      // Sauvegarde locale pour débogage
      const fs = require('fs');
      doc.pipe(fs.createWriteStream(`test_avoir_${avoirId}.pdf`));
      console.log(`PDF sauvegardé localement : test_avoir_${avoirId}.pdf`);

      // Associer le flux PDF à la réponse
      doc.pipe(res);

      // Ajouter le logo en arrière-plan (filigrane) sur toutes les pages
      doc.on('pageAdded', () => {
        try {
          doc
            .image('src/uploads/rmlogo.png', 150, 200, {
              width: 300,
              opacity: 0.1,
            })
            .restore();
        } catch (error) {
          console.warn('Logo de fond non trouvé, ignoré');
        }
      });

      if (type === 'full') {
        // En-tête réorganisé
        const headerTop = 40;
        const headerHeight = 80;
        const pageWidth = 595.28;
        const margin = 40;
        const sectionWidth = (pageWidth - 2 * margin) / 3;

        // Section 1 : Alliance Pharma (gauche)
        doc
          .rect(margin, headerTop, sectionWidth, headerHeight)
          .strokeColor('black')
          .stroke();
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('ALLIANCE PHARMA', margin + 10, headerTop + 10, {
          width: sectionWidth - 20,
          align: 'center',
        });
        doc.fontSize(8).font('Helvetica');
        doc.text('Tel: 80130610', margin + 10, headerTop + 25, {
          width: sectionWidth - 20,
          align: 'center',
        });
        doc.text(
          'RCCM: NE/NIM/01/2024/B14/00004',
          margin + 10,
          headerTop + 35,
          {
            width: sectionWidth - 20,
            align: 'center',
          },
        );
        doc.text('NIF: 37364/R', margin + 10, headerTop + 45, {
          width: sectionWidth - 20,
          align: 'center',
        });
        doc.text('BP: 11807', margin + 10, headerTop + 55, {
          width: sectionWidth - 20,
          align: 'center',
        });
        doc.text('Adresse: NIAMEY', margin + 10, headerTop + 65, {
          width: sectionWidth - 20,
          align: 'center',
        });

        // Section 2 : Logo (milieu)
        doc
          .rect(margin + sectionWidth, headerTop, sectionWidth, headerHeight)
          .strokeColor('black')
          .stroke();
        try {
          doc.image(
            'src/uploads/rmlogo.png',
            margin + sectionWidth + (sectionWidth - 90) / 2,
            headerTop + 10,
            { width: 90 },
          );
        } catch (error) {
          console.warn('Logo non trouvé, placeholder utilisé');
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('LOGO', margin + sectionWidth + 10, headerTop + 40, {
              width: sectionWidth - 20,
              align: 'center',
            });
        }

        // Section 3 : Numéro avoir et date (droite)
        doc
          .rect(
            margin + 2 * sectionWidth,
            headerTop,
            sectionWidth,
            headerHeight,
          )
          .strokeColor('black')
          .stroke();
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(
          `AVOIR N° ${sanitizeString(avoir.numero_facture_certifiee)}`,
          margin + 2 * sectionWidth + 10,
          headerTop + 10,
          { width: sectionWidth - 20, align: 'center' },
        );
        doc.fontSize(8).font('Helvetica');
        doc.text(
          `Date: ${avoir.date_avoir ? formatDate(new Date(avoir.date_avoir)) : 'N/A'}`,
          margin + 2 * sectionWidth + 10,
          headerTop + 30,
          { width: sectionWidth - 20, align: 'center' },
        );

        // Traits verticaux pour séparer les sections
        doc
          .moveTo(margin + sectionWidth, headerTop)
          .lineTo(margin + sectionWidth, headerTop + headerHeight)
          .stroke();
        doc
          .moveTo(margin + 2 * sectionWidth, headerTop)
          .lineTo(margin + 2 * sectionWidth, headerTop + headerHeight)
          .stroke();

        // Ligne de séparation sous l'en-tête
        doc
          .moveTo(margin, headerTop + headerHeight + 10)
          .lineTo(pageWidth - margin, headerTop + headerHeight + 10)
          .stroke();

        // Infos utilisateur connecté et client
        const infoTop = headerTop + headerHeight + 20;
        doc.fontSize(8).font('Helvetica');
        doc.text(
          `Login: ${sanitizeString(avoir.login || 'N/A')}`,
          margin,
          infoTop,
        );

        // Infos client (à droite)
        const clientX = margin + 400;
        doc.text(
          `Client: ${sanitizeString(avoir.client?.nom)} ${sanitizeString(avoir.client?.prenom || '')}`,
          clientX,
          infoTop,
        );
        doc.text(
          `NIF: ${sanitizeString(avoir.client?.nif || 'N/A')}`,
          clientX,
          infoTop + 15,
        );
        doc.text(
          `Adresse: ${sanitizeString(avoir.client?.adresse || 'N/A')}`,
          clientX,
          infoTop + 30,
        );
        doc.text(
          `Téléphone: ${sanitizeString(avoir.client?.telephone || 'N/A')}`,
          clientX,
          infoTop + 45,
        );

        // Tableau des produits corrigés
        const tableTop = infoTop + 60;
        const tableLeft = margin;
        const columnWidths = [200, 80, 80, 100, 80];
        const rowHeight = 20;
        const maxY = 750;

        // En-tête du tableau
        const drawTableHeader = (
          tableTop: number,
          tableLeft: number,
          columnWidths: number[],
        ) => {
          doc.fontSize(10).font('Helvetica-Bold');
          let x = tableLeft;
          const headers = [
            'Désignation',
            'Quantité',
            'Prix Unitaire',
            "Date d'expiration",
            'Montant',
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
        };

        drawTableHeader(tableTop, tableLeft, columnWidths);

        // Lignes du tableau (uniquement les lignes corrigées)
        doc.font('Helvetica');
        let y = tableTop + 30;
        let subtotal = 0;

        if (correctedLignes.length > 0) {
          correctedLignes.forEach((ligne) => {
            if (y + rowHeight > maxY) {
              doc.addPage();
              y = 40;
              drawTableHeader(y, tableLeft, columnWidths);
              y += 30;
            }

            const totalLigne = ligne.montant;
            subtotal += totalLigne;
            let x = tableLeft;
            doc.text(
              sanitizeString(
                ligne.produit?.produit || ligne.designation.toString(),
              ),
              x,
              y,
              { width: columnWidths[0], align: 'left' },
            );
            doc.text(ligne.quantite.toString(), x + columnWidths[0], y, {
              width: columnWidths[1],
              align: 'center',
            });
            doc.text(
              Number(ligne.prix_vente || 0).toFixed(2),
              x + columnWidths[0] + columnWidths[1],
              y,
              { width: columnWidths[2], align: 'center' },
            );
            doc.text(
              formatDate(ligne.produit?.validite_amm) || 'N/A',
              x + columnWidths[0] + columnWidths[1] + columnWidths[2],
              y,
              { width: columnWidths[3], align: 'center' },
            );
            doc.text(
              Number(totalLigne || 0).toFixed(2),
              x +
                columnWidths[0] +
                columnWidths[1] +
                columnWidths[2] +
                columnWidths[3],
              y,
              { width: columnWidths[4], align: 'center' },
            );
            y += rowHeight;
          });
        } else {
          doc.text('Aucune ligne corrigée', tableLeft, y, { align: 'center' });
          y += rowHeight;
        }
        doc
          .moveTo(tableLeft, y)
          .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y)
          .stroke();

        // Commentaires
        let currentY = y + 20;
        const comments = [
          correctedCommentaire1,
          avoir.commentaire2,
          avoir.commentaire3,
          avoir.commentaire4,
          avoir.commentaire5,
          avoir.commentaire6,
          avoir.commentaire7,
          avoir.commentaire8,
        ].filter((comment) => comment);
        if (comments.length > 0) {
          if (currentY + 15 > maxY) {
            doc.addPage();
            currentY = 40;
          }
          doc.fontSize(10).font('Helvetica');
          doc.text('Commentaires:', tableLeft, currentY);
          currentY += 15;
          comments.forEach((comment) => {
            if (currentY + 15 > maxY) {
              doc.addPage();
              currentY = 40;
            }
            doc.text(sanitizeString(comment), tableLeft, currentY, {
              width: 510,
              align: 'left',
            });
            currentY += sanitizeString(comment).length > 80 ? 30 : 15;
          });
        }

        // Résumé
        let summaryTop = currentY + 20;
        if (summaryTop + 150 > maxY) {
          doc.addPage();
          summaryTop = 40;
        }

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Résumé', margin, summaryTop);
        doc.fontSize(8).font('Helvetica');
        doc.text(
          `Total TVA: ${Number(avoir.tva || 0).toFixed(2)} CFA`,
          margin + 300,
          summaryTop + 10,
          { align: 'right' },
        );
        const precompte = Number(avoir.isb || 0);
        doc.text(
          `Précompte BIC [A] 2%: ${precompte.toFixed(2)} CFA`,
          margin + 300,
          summaryTop + 25,
          { align: 'right' },
        );
        doc.text(
          `Total TTC: ${Number(avoir.montant_total || 0).toFixed(2)} CFA`,
          margin + 300,
          summaryTop + 40,
          { align: 'right' },
        );
        doc.text(
          `Montant Restant: ${Number(avoir.montant_restant || 0).toFixed(2)} CFA`,
          margin + 300,
          summaryTop + 55,
          { align: 'right' },
        );
        doc.text(
          `Type de règlement: ${sanitizeString(avoir.type_reglement || 'N/A')}`,
          margin + 300,
          summaryTop + 70,
          { align: 'right' },
        );
        doc.text(
          `Nombre d'articles corrigés: ${correctedLignes.length}`,
          margin + 300,
          summaryTop + 85,
          { align: 'right' },
        );
        doc.text('* Montants en francs CFA', margin + 300, summaryTop + 100, {
          align: 'right',
        });
        doc.text(
          `Arrêté le présent avoir à ${numberToWordsFr(Number(avoir.montant_total || 0))} francs CFA`,
          margin,
          summaryTop + 115,
        );
        doc.text('Le Gestionnaire', margin, summaryTop + 130, {
          underline: true,
        });

        doc
          .moveTo(margin, summaryTop + 145)
          .lineTo(pageWidth - margin, summaryTop + 145)
          .stroke();
      } else {
        // PDF Simplifié
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(
          `AVOIR N° ${sanitizeString(avoir.numero_facture_certifiee)}`,
          50,
          50,
        );
        doc.fontSize(10).font('Helvetica');
        doc.text(
          `Date: ${avoir.date_avoir ? formatDate(new Date(avoir.date_avoir)) : 'N/A'}`,
          50,
          65,
        );
        doc.text(
          `Client: ${sanitizeString(avoir.client?.nom)} ${sanitizeString(avoir.client?.prenom || '')}`,
          50,
          80,
        );

        // Tableau des produits corrigés
        const tableTop = 110;
        const tableLeft = 50;
        const rowHeight = 20;
        const maxY = 750;

        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Désignation', tableLeft, tableTop, { width: 200 });
        doc.text('Quantité', tableLeft + 200, tableTop, {
          width: 100,
          align: 'right',
        });
        doc.text('Montant', tableLeft + 300, tableTop, {
          width: 100,
          align: 'right',
        });
        doc
          .moveTo(tableLeft, tableTop + 15)
          .lineTo(450, tableTop + 15)
          .stroke();

        let y = tableTop + rowHeight;
        let subtotal = 0;

        doc.font('Helvetica');
        if (correctedLignes.length > 0) {
          correctedLignes.forEach((ligne) => {
            if (y + rowHeight > maxY) {
              doc.addPage();
              y = 40;
              doc.fontSize(8).font('Helvetica-Bold');
              doc.text('Désignation', tableLeft, y, { width: 200 });
              doc.text('Quantité', tableLeft + 200, y, {
                width: 100,
                align: 'right',
              });
              doc.text('Montant', tableLeft + 300, y, {
                width: 100,
                align: 'right',
              });
              doc
                .moveTo(tableLeft, y + 15)
                .lineTo(450, y + 15)
                .stroke();
              y += rowHeight;
            }

            const totalLigne = ligne.montant;
            subtotal += totalLigne;
            doc.fontSize(8).font('Helvetica');
            doc.text(
              sanitizeString(
                ligne.produit?.produit || ligne.designation.toString(),
              ),
              tableLeft,
              y,
              { width: 200 },
            );
            doc.text(ligne.quantite.toString(), tableLeft + 200, y, {
              width: 100,
              align: 'right',
            });
            doc.text(Number(totalLigne || 0).toFixed(2), tableLeft + 300, y, {
              width: 100,
              align: 'right',
            });
            y += rowHeight;
          });
        } else {
          doc.text('Aucune ligne corrigée', tableLeft, y, { align: 'center' });
          y += rowHeight;
        }

        doc.moveTo(tableLeft, y).lineTo(450, y).stroke();

        // Commentaires
        let totalTop = y + 20;
        const comments = [
          correctedCommentaire1,
          avoir.commentaire2,
          avoir.commentaire3,
          avoir.commentaire4,
          avoir.commentaire5,
          avoir.commentaire6,
          avoir.commentaire7,
          avoir.commentaire8,
        ].filter((comment) => comment);
        if (comments.length > 0) {
          if (totalTop + 15 > maxY) {
            doc.addPage();
            totalTop = 40;
          }
          doc.fontSize(8).font('Helvetica');
          doc.text('Commentaires:', tableLeft, totalTop);
          totalTop += 15;
          comments.forEach((comment) => {
            if (totalTop + 15 > maxY) {
              doc.addPage();
              totalTop = 40;
            }
            doc.text(sanitizeString(comment), tableLeft, totalTop, {
              width: 400,
              align: 'left',
            });
            totalTop += sanitizeString(comment).length > 80 ? 30 : 15;
          });
        }

        if (totalTop + 20 > maxY) {
          doc.addPage();
          totalTop = 40;
        }

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(
          `TOTAL TTC: ${Number(avoir.montant_total || 0).toFixed(2)} CFA`,
          450,
          totalTop,
          { align: 'right' },
        );
      }

      // Finaliser le document
      console.log('Finalisation du PDF pour avoir', avoirId);
      doc.end();

      // Mettre à jour l'avoir
      avoir.imprimee = 1;
      await this.avoirRepository.save(avoir);
    } catch (error) {
      console.error(
        'Erreur lors de la génération du PDF:',
        JSON.stringify(error, null, 2),
      );
      if (!res.headersSent) {
        res.status(500).json({
          message: `Erreur lors de la génération du PDF: ${error.message}`,
        });
      }
      throw new InternalServerErrorException(
        `Erreur lors de la génération du PDF: ${error.message}`,
      );
    }
  }
}

// async printAvoirToPdf(
//   id: number | string,
//   res: Response,
//   type: 'full' | 'simple' = 'full',
// ): Promise<void> {
//   try {
//     // Convertir et valider l'ID
//     const avoirId = Number(id);
//     if (isNaN(avoirId) || !Number.isInteger(avoirId) || avoirId <= 0) {
//       throw new BadRequestException("ID de l'avoir invalide");
//     }

//     // Récupérer l'avoir avec les lignes et produits
//     const avoir = await this.avoirRepository.findOne({
//       where: { id_avoir: avoirId },
//       relations: ['client', 'lignes', 'lignes.produit'],
//     });

//     if (!avoir) {
//       throw new NotFoundException(`Avoir avec id ${avoirId} non trouvé`);
//     }

//     console.log('Avoir récupéré:', JSON.stringify(avoir, null, 2));

//     // Créer un nouveau document PDF
//     const doc = new PDFDocument({ size: 'A4', margin: 40 });

//     // Configurer les en-têtes HTTP
//     res.setHeader('Content-Type', 'application/pdf');
//     const filename = `avoir_${sanitizeString(avoir.numero_facture_certifiee)}_${type}.pdf`;
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename="${filename}"`,
//     );

//     // Gérer les erreurs du flux
//     doc.on('error', (err) => {
//       console.error('Erreur dans le flux PDF:', err);
//       if (!res.headersSent) {
//         res
//           .status(500)
//           .json({ message: 'Erreur lors de la génération du PDF' });
//       }
//     });

//     // Sauvegarde locale pour débogage
//     const fs = require('fs');
//     doc.pipe(fs.createWriteStream(`test_avoir_${avoirId}.pdf`));
//     console.log(`PDF sauvegardé localement : test_avoir_${avoirId}.pdf`);

//     // Associer le flux PDF à la réponse
//     doc.pipe(res);

//     // Ajouter le logo en arrière-plan (filigrane) sur toutes les pages
//     doc.on('pageAdded', () => {
//       try {
//         doc
//           .image('src/uploads/rmlogo.png', 150, 200, {
//             width: 300,
//             opacity: 0.1,
//           })
//           .restore();
//       } catch (error) {
//         console.warn('Logo de fond non trouvé, ignoré');
//       }
//     });

//     if (type === 'full') {
//       // En-tête réorganisé
//       const headerTop = 40;
//       const headerHeight = 80;
//       const pageWidth = 595.28;
//       const margin = 40;
//       const sectionWidth = (pageWidth - 2 * margin) / 3;

//       // Section 1 : Alliance Pharma (gauche)
//       doc
//         .rect(margin, headerTop, sectionWidth, headerHeight)
//         .strokeColor('black')
//         .stroke();
//       doc.fontSize(10).font('Helvetica-Bold');
//       doc.text('ALLIANCE PHARMA', margin + 10, headerTop + 10, {
//         width: sectionWidth - 20,
//         align: 'center',
//       });
//       doc.fontSize(8).font('Helvetica');
//       doc.text('Tel: 80130610', margin + 10, headerTop + 25, {
//         width: sectionWidth - 20,
//         align: 'center',
//       });
//       doc.text(
//         'RCCM: NE/NIM/01/2024/B14/00004',
//         margin + 10,
//         headerTop + 35,
//         {
//           width: sectionWidth - 20,
//           align: 'center',
//         },
//       );
//       doc.text('NIF: 37364/R', margin + 10, headerTop + 45, {
//         width: sectionWidth - 20,
//         align: 'center',
//       });
//       doc.text('BP: 11807', margin + 10, headerTop + 55, {
//         width: sectionWidth - 20,
//         align: 'center',
//       });
//       doc.text('Adresse: NIAMEY', margin + 10, headerTop + 65, {
//         width: sectionWidth - 20,
//         align: 'center',
//       });

//       // Section 2 : Logo (milieu)
//       doc
//         .rect(margin + sectionWidth, headerTop, sectionWidth, headerHeight)
//         .strokeColor('black')
//         .stroke();
//       try {
//         doc.image(
//           'src/uploads/rmlogo.png',
//           margin + sectionWidth + (sectionWidth - 90) / 2,
//           headerTop + 10,
//           { width: 90 },
//         );
//       } catch (error) {
//         console.warn('Logo non trouvé, placeholder utilisé');
//         doc
//           .fontSize(10)
//           .font('Helvetica-Bold')
//           .text('LOGO', margin + sectionWidth + 10, headerTop + 40, {
//             width: sectionWidth - 20,
//             align: 'center',
//           });
//       }

//       // Section 3 : Numéro avoir et date (droite)
//       doc
//         .rect(
//           margin + 2 * sectionWidth,
//           headerTop,
//           sectionWidth,
//           headerHeight,
//         )
//         .strokeColor('black')
//         .stroke();
//       doc.fontSize(10).font('Helvetica-Bold');
//       doc.text(
//         `AVOIR N° ${sanitizeString(avoir.numero_facture_certifiee)}`,
//         margin + 2 * sectionWidth + 10,
//         headerTop + 10,
//         { width: sectionWidth - 20, align: 'center' },
//       );
//       doc.fontSize(8).font('Helvetica');
//       doc.text(
//         `Date: ${avoir.date_avoir ? formatDate(new Date(avoir.date_avoir)) : 'N/A'}`,
//         margin + 2 * sectionWidth + 10,
//         headerTop + 30,
//         { width: sectionWidth - 20, align: 'center' },
//       );

//       // Traits verticaux pour séparer les sections
//       doc
//         .moveTo(margin + sectionWidth, headerTop)
//         .lineTo(margin + sectionWidth, headerTop + headerHeight)
//         .stroke();
//       doc
//         .moveTo(margin + 2 * sectionWidth, headerTop)
//         .lineTo(margin + 2 * sectionWidth, headerTop + headerHeight)
//         .stroke();

//       // Ligne de séparation sous l'en-tête
//       doc
//         .moveTo(margin, headerTop + headerHeight + 10)
//         .lineTo(pageWidth - margin, headerTop + headerHeight + 10)
//         .stroke();

//       // Infos utilisateur connecté et client
//       const infoTop = headerTop + headerHeight + 20;
//       doc.fontSize(8).font('Helvetica');
//       doc.text(
//         `Login: ${sanitizeString(avoir.login || 'N/A')}`,
//         margin,
//         infoTop,
//       );

//       // Infos client (à droite)
//       const clientX = margin + 400;
//       doc.text(
//         `Client: ${sanitizeString(avoir.client?.nom)} ${sanitizeString(avoir.client?.prenom || '')}`,
//         clientX,
//         infoTop,
//       );
//       doc.text(
//         `NIF: ${sanitizeString(avoir.client?.nif || 'N/A')}`,
//         clientX,
//         infoTop + 15,
//       );
//       doc.text(
//         `Adresse: ${sanitizeString(avoir.client?.adresse || 'N/A')}`,
//         clientX,
//         infoTop + 30,
//       );
//       doc.text(
//         `Téléphone: ${sanitizeString(avoir.client?.telephone || 'N/A')}`,
//         clientX,
//         infoTop + 45,
//       );

//       // Tableau des produits
//       const tableTop = infoTop + 60;
//       const tableLeft = margin;
//       const columnWidths = [200, 80, 80, 100, 80];
//       const rowHeight = 20;
//       const maxY = 750;

//       // En-tête du tableau
//       const drawTableHeader = (
//         tableTop: number,
//         tableLeft: number,
//         columnWidths: number[],
//       ) => {
//         doc.fontSize(10).font('Helvetica-Bold');
//         let x = tableLeft;
//         const headers = [
//           'Désignation',
//           'Quantité',
//           'Prix Unitaire',
//           "Date d'expiration",
//           'Montant',
//         ];
//         headers.forEach((header, i) => {
//           doc.text(header, x, tableTop, {
//             width: columnWidths[i],
//             align: 'center',
//           });
//           x += columnWidths[i];
//         });
//         doc
//           .moveTo(tableLeft, tableTop + 20)
//           .lineTo(
//             tableLeft + columnWidths.reduce((a, b) => a + b, 0),
//             tableTop + 20,
//           )
//           .stroke();
//       };

//       drawTableHeader(tableTop, tableLeft, columnWidths);

//       // Lignes du tableau
//       doc.font('Helvetica');
//       let y = tableTop + 30;
//       let subtotal = 0;

//       if (avoir.lignes && avoir.lignes.length > 0) {
//         avoir.lignes.forEach((ligne) => {
//           if (y + rowHeight > maxY) {
//             doc.addPage();
//             y = 40;
//             drawTableHeader(y, tableLeft, columnWidths);
//             y += 30;
//           }

//           const totalLigne = ligne.montant;
//           subtotal += totalLigne;
//           let x = tableLeft;
//           doc.text(
//             sanitizeString(
//               ligne.produit?.produit || ligne.designation.toString(),
//             ),
//             x,
//             y,
//             { width: columnWidths[0], align: 'left' },
//           );
//           doc.text(ligne.quantite.toString(), x + columnWidths[0], y, {
//             width: columnWidths[1],
//             align: 'center',
//           });
//           doc.text(
//             Number(ligne.prix_vente || 0).toFixed(2),
//             x + columnWidths[0] + columnWidths[1],
//             y,
//             { width: columnWidths[2], align: 'center' },
//           );
//           doc.text(
//             formatDate(ligne.produit?.validite_amm),
//             x + columnWidths[0] + columnWidths[1] + columnWidths[2],
//             y,
//             { width: columnWidths[3], align: 'center' },
//           );
//           doc.text(
//             Number(totalLigne || 0).toFixed(2),
//             x +
//               columnWidths[0] +
//               columnWidths[1] +
//               columnWidths[2] +
//               columnWidths[3],
//             y,
//             { width: columnWidths[4], align: 'center' },
//           );
//           y += rowHeight;
//         });
//       } else {
//         doc.text('Aucune ligne associée', tableLeft, y, { align: 'center' });
//         y += rowHeight;
//       }
//       doc
//         .moveTo(tableLeft, y)
//         .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y)
//         .stroke();

//       // Commentaires
//       let currentY = y + 20;
//       const comments = [
//         avoir.commentaire1,
//         avoir.commentaire2,
//         avoir.commentaire3,
//         avoir.commentaire4,
//         avoir.commentaire5,
//         avoir.commentaire6,
//         avoir.commentaire7,
//         avoir.commentaire8,
//       ].filter((comment) => comment);
//       if (comments.length > 0) {
//         if (currentY + 15 > maxY) {
//           doc.addPage();
//           currentY = 40;
//         }
//         doc.fontSize(10).font('Helvetica');
//         doc.text('Commentaires:', tableLeft, currentY);
//         currentY += 15;
//         comments.forEach((comment) => {
//           if (currentY + 15 > maxY) {
//             doc.addPage();
//             currentY = 40;
//           }
//           doc.text(sanitizeString(comment), tableLeft, currentY, {
//             width: 510,
//             align: 'left',
//           });
//           currentY += sanitizeString(comment).length > 80 ? 30 : 15;
//         });
//       }

//       // Résumé
//       let summaryTop = currentY + 20;
//       if (summaryTop + 150 > maxY) {
//         doc.addPage();
//         summaryTop = 40;
//       }

//       doc.fontSize(10).font('Helvetica-Bold');
//       doc.text('Résumé', margin, summaryTop);
//       doc.fontSize(8).font('Helvetica');
//       doc.text(
//         `Total TVA: ${Number(avoir.tva || 0).toFixed(2)} CFA`,
//         margin + 300,
//         summaryTop + 10,
//         { align: 'right' },
//       );
//       const precompte = Number(avoir.isb || 0);
//       doc.text(
//         `Précompte BIC [A] 2%: ${precompte.toFixed(2)} CFA`,
//         margin + 300,
//         summaryTop + 25,
//         { align: 'right' },
//       );
//       doc.text(
//         `Total TTC: ${Number(avoir.montant_total || 0).toFixed(2)} CFA`,
//         margin + 300,
//         summaryTop + 40,
//         { align: 'right' },
//       );
//       doc.text(
//         `Montant Restant: ${Number(avoir.montant_restant || 0).toFixed(2)} CFA`,
//         margin + 300,
//         summaryTop + 55,
//         { align: 'right' },
//       );
//       doc.text(
//         `Type de règlement: ${sanitizeString(avoir.type_reglement || 'N/A')}`,
//         margin + 300,
//         summaryTop + 70,
//         { align: 'right' },
//       );
//       doc.text(
//         `Nombre d'articles: ${avoir.lignes?.length || 0}`,
//         margin + 300,
//         summaryTop + 85,
//         { align: 'right' },
//       );
//       doc.text('* Montants en francs CFA', margin + 300, summaryTop + 100, {
//         align: 'right',
//       });
//       doc.text(
//         `Arrêté le présent avoir à ${numberToWordsFr(Number(avoir.montant_total || 0))} francs CFA`,
//         margin,
//         summaryTop + 115,
//       );
//       doc.text('Le Gestionnaire', margin, summaryTop + 130, {
//         underline: true,
//       });

//       doc
//         .moveTo(margin, summaryTop + 145)
//         .lineTo(pageWidth - margin, summaryTop + 145)
//         .stroke();
//     } else {
//       // PDF Simplifié
//       doc.fontSize(12).font('Helvetica-Bold');
//       doc.text(
//         `AVOIR N° ${sanitizeString(avoir.numero_facture_certifiee)}`,
//         50,
//         50,
//       );
//       doc.fontSize(10).font('Helvetica');
//       doc.text(
//         `Date: ${avoir.date_avoir ? formatDate(new Date(avoir.date_avoir)) : 'N/A'}`,
//         50,
//         65,
//       );
//       doc.text(
//         `Client: ${sanitizeString(avoir.client?.nom)} ${sanitizeString(avoir.client?.prenom || '')}`,
//         50,
//         80,
//       );

//       // Tableau des produits
//       const tableTop = 110;
//       const tableLeft = 50;
//       const rowHeight = 20;
//       const maxY = 750;

//       doc.fontSize(8).font('Helvetica-Bold');
//       doc.text('Désignation', tableLeft, tableTop, { width: 200 });
//       doc.text('Quantité', tableLeft + 200, tableTop, {
//         width: 100,
//         align: 'right',
//       });
//       doc.text('Montant', tableLeft + 300, tableTop, {
//         width: 100,
//         align: 'right',
//       });
//       doc
//         .moveTo(tableLeft, tableTop + 15)
//         .lineTo(450, tableTop + 15)
//         .stroke();

//       let y = tableTop + rowHeight;
//       let subtotal = 0;

//       doc.font('Helvetica');
//       if (avoir.lignes && avoir.lignes.length > 0) {
//         avoir.lignes.forEach((ligne) => {
//           if (y + rowHeight > maxY) {
//             doc.addPage();
//             y = 40;
//             doc.fontSize(8).font('Helvetica-Bold');
//             doc.text('Désignation', tableLeft, y, { width: 200 });
//             doc.text('Quantité', tableLeft + 200, y, {
//               width: 100,
//               align: 'right',
//             });
//             doc.text('Montant', tableLeft + 300, y, {
//               width: 100,
//               align: 'right',
//             });
//             doc
//               .moveTo(tableLeft, y + 15)
//               .lineTo(450, y + 15)
//               .stroke();
//             y += rowHeight;
//           }

//           const totalLigne = ligne.montant;
//           subtotal += totalLigne;
//           doc.fontSize(8).font('Helvetica');
//           doc.text(
//             sanitizeString(
//               ligne.produit?.produit || ligne.designation.toString(),
//             ),
//             tableLeft,
//             y,
//             { width: 200 },
//           );
//           doc.text(ligne.quantite.toString(), tableLeft + 200, y, {
//             width: 100,
//             align: 'right',
//           });
//           doc.text(Number(totalLigne || 0).toFixed(2), tableLeft + 300, y, {
//             width: 100,
//             align: 'right',
//           });
//           y += rowHeight;
//         });
//       } else {
//         doc.text('Aucune ligne associée', tableLeft, y, { align: 'center' });
//         y += rowHeight;
//       }

//       doc.moveTo(tableLeft, y).lineTo(450, y).stroke();

//       // Commentaires
//       let totalTop = y + 20;
//       const comments = [
//         avoir.commentaire1,
//         avoir.commentaire2,
//         avoir.commentaire3,
//         avoir.commentaire4,
//         avoir.commentaire5,
//         avoir.commentaire6,
//         avoir.commentaire7,
//         avoir.commentaire8,
//       ].filter((comment) => comment);
//       if (comments.length > 0) {
//         if (totalTop + 15 > maxY) {
//           doc.addPage();
//           totalTop = 40;
//         }
//         doc.fontSize(8).font('Helvetica');
//         doc.text('Commentaires:', tableLeft, totalTop);
//         totalTop += 15;
//         comments.forEach((comment) => {
//           if (totalTop + 15 > maxY) {
//             doc.addPage();
//             totalTop = 40;
//           }
//           doc.text(sanitizeString(comment), tableLeft, totalTop, {
//             width: 400,
//             align: 'left',
//           });
//           totalTop += sanitizeString(comment).length > 80 ? 30 : 15;
//         });
//       }

//       if (totalTop + 20 > maxY) {
//         doc.addPage();
//         totalTop = 40;
//       }

//       doc.fontSize(10).font('Helvetica-Bold');
//       doc.text(
//         `TOTAL TTC: ${Number(avoir.montant_total || 0).toFixed(2)} CFA`,
//         450,
//         totalTop,
//         { align: 'right' },
//       );
//     }

//     // Finaliser le document
//     console.log('Finalisation du PDF pour avoir', avoirId);
//     doc.end();

//     // Mettre à jour l'avoir
//     avoir.imprimee = 1;
//     await this.avoirRepository.save(avoir);
//   } catch (error) {
//     console.error(
//       'Erreur lors de la génération du PDF:',
//       JSON.stringify(error, null, 2),
//     );
//     if (!res.headersSent) {
//       res.status(500).json({
//         message: `Erreur lors de la génération du PDF: ${error.message}`,
//       });
//     }
//     throw new InternalServerErrorException(
//       `Erreur lors de la génération du PDF: ${error.message}`,
//     );
//   }
// }

// async printAvoirToPdf(
//   id: number | string,
//   res: Response,
//   type: 'full' | 'simple' = 'full',
// ): Promise<void> {
//   try {
//     // Convertir et valider l'ID
//     const avoirId = Number(id);
//     if (isNaN(avoirId) || !Number.isInteger(avoirId) || avoirId <= 0) {
//       throw new BadRequestException("ID de l'avoir invalide");
//     }

//     // Récupérer l'avoir
//     const avoir = await this.avoirRepository.findOne({
//       where: { id_avoir: avoirId },
//       relations: ['client'],
//     });

//     if (!avoir) {
//       throw new NotFoundException(`Avoir avec id ${avoirId} non trouvé`);
//     }

//     console.log('Avoir récupéré:', JSON.stringify(avoir, null, 2));

//     // Créer un nouveau document PDF
//     const doc = new PDFDocument({ size: 'A4', margin: 40 });

//     // Configurer les en-têtes HTTP
//     res.setHeader('Content-Type', 'application/pdf');
//     const filename = `avoir_${sanitizeString(avoir.numero_facture_certifiee)}_${type}.pdf`;
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename="${filename}"`,
//     );

//     // Gérer les erreurs du flux
//     doc.on('error', (err) => {
//       console.error('Erreur dans le flux PDF:', err);
//       if (!res.headersSent) {
//         res
//           .status(500)
//           .json({ message: 'Erreur lors de la génération du PDF' });
//       }
//     });

//     // Associer le flux PDF à la réponse
//     doc.pipe(res);

//     // Sauvegarde locale pour débogage
//     const fs = require('fs');
//     doc.pipe(fs.createWriteStream(`test_avoir_${avoirId}.pdf`));
//     console.log(`PDF sauvegardé localement : test_avoir_${avoirId}.pdf`);

//     if (type === 'full') {
//       // En-tête
//       doc.fontSize(10).font('Helvetica-Bold');
//       try {
//         doc.image('src/uploads/rmlogo.png', 40, 40, { width: 90 });
//       } catch (error) {
//         console.warn('Logo non trouvé, placeholder utilisé');
//         doc.text('LOGO', 40, 40);
//       }
//       doc.text('ALLIANCE PHARMA', 160, 50, { align: 'center' });
//       doc.fontSize(10).font('Helvetica');
//       doc.text('Tel: 80130610', 160, 70, { align: 'center' });
//       doc.text('RCCM: NE/NIM/01/2024/B14/00004', 160, 85, {
//         align: 'center',
//       });
//       doc.text('NIF: 37364/R', 160, 100, { align: 'center' });
//       doc.text('BP: 11807', 160, 115, { align: 'center' });
//       doc.text('Adresse: NIAMEY', 160, 130, { align: 'center' });
//       doc.fontSize(12).font('Helvetica-Bold');
//       doc.text(
//         `AVOIR N° ${sanitizeString(avoir.numero_facture_certifiee)}`,
//         400,
//         50,
//         { align: 'right' },
//       );
//       doc.fontSize(10).font('Helvetica');
//       doc.text(
//         `Date: ${avoir.date_avoir ? new Date(avoir.date_avoir).toLocaleString('fr-FR') : 'N/A'}`,
//         400,
//         70,
//         { align: 'right' },
//       );

//       // Ligne de séparation
//       doc.moveTo(40, 160).lineTo(550, 160).stroke();

//       // Infos client
//       doc.fontSize(10).font('Helvetica');
//       doc.text(
//         `Client: ${sanitizeString(avoir.client?.nom)} ${sanitizeString(avoir.client?.prenom)}`,
//         40,
//         170,
//       );
//       doc.text(`NIF: ${sanitizeString(avoir.client?.nif)}`, 40, 185);
//       doc.text(`Adresse: ${sanitizeString(avoir.client?.adresse)}`, 40, 200);
//       doc.text(
//         `Téléphone: ${sanitizeString(avoir.client?.telephone)}`,
//         40,
//         215,
//       );

//       // Tableau des détails de l'avoir
//       const tableTop = 240;
//       const tableLeft = 40;
//       const columnWidths = [80, 120, 100, 100, 100];
//       const headers = [
//         'ID Avoir',
//         'Numéro Facture',
//         'Date',
//         'Montant Total',
//         'Montant Restant',
//       ];
//       const totalWidth = columnWidths.reduce((a, b) => a + b, 0);

//       doc.fontSize(10).font('Helvetica-Bold');
//       let x = tableLeft;
//       headers.forEach((header, i) => {
//         doc.text(header, x, tableTop, {
//           width: columnWidths[i],
//           align: 'center',
//         });
//         x += columnWidths[i];
//       });
//       doc
//         .moveTo(tableLeft, tableTop + 20)
//         .lineTo(tableLeft + totalWidth, tableTop + 20)
//         .stroke();

//       // Ligne de l'avoir
//       doc.font('Helvetica');
//       const y = tableTop + 30;
//       x = tableLeft;
//       doc.text(avoir.id_avoir.toString(), x, y, {
//         width: columnWidths[0],
//         align: 'center',
//       });
//       doc.text(
//         sanitizeString(avoir.numero_facture_certifiee),
//         x + columnWidths[0],
//         y,
//         {
//           width: columnWidths[1],
//           align: 'center',
//         },
//       );
//       doc.text(
//         avoir.date_avoir
//           ? new Date(avoir.date_avoir).toLocaleDateString('fr-FR')
//           : 'N/A',
//         x + columnWidths[0] + columnWidths[1],
//         y,
//         { width: columnWidths[2], align: 'center' },
//       );
//       doc.text(
//         Number(avoir.montant_total || 0).toFixed(2),
//         x + columnWidths[0] + columnWidths[1] + columnWidths[2],
//         y,
//         { width: columnWidths[3], align: 'center' },
//       );
//       doc.text(
//         Number(avoir.montant_restant || 0).toFixed(2),
//         x +
//           columnWidths[0] +
//           columnWidths[1] +
//           columnWidths[2] +
//           columnWidths[3],
//         y,
//         { width: columnWidths[4], align: 'center' },
//       );
//       doc
//         .moveTo(tableLeft, y + 20)
//         .lineTo(tableLeft + totalWidth, y + 20)
//         .stroke();

//       // Commentaires
//       let currentY = y + 40;
//       const comments = [
//         avoir.commentaire1,
//         avoir.commentaire2,
//         avoir.commentaire3,
//         avoir.commentaire4,
//         avoir.commentaire5,
//         avoir.commentaire6,
//         avoir.commentaire7,
//         avoir.commentaire8,
//       ].filter((comment) => comment);
//       if (comments.length > 0) {
//         doc.fontSize(10).font('Helvetica');
//         doc.text('Commentaires:', 40, currentY);
//         currentY += 15;
//         comments.forEach((comment) => {
//           doc.text(sanitizeString(comment), 40, currentY, {
//             width: 510,
//             align: 'left',
//           });
//           currentY += 15;
//         });
//       }

//       // Résumé
//       const summaryTop = currentY;
//       doc.fontSize(12).font('Helvetica-Bold');
//       doc.text('Résumé', 40, summaryTop);
//       doc.fontSize(10).font('Helvetica');
//       doc.text(
//         `Montant Total: ${Number(avoir.montant_total || 0).toFixed(2)} CFA`,
//         400,
//         summaryTop + 10,
//         { align: 'right' },
//       );
//       doc.text(
//         `Montant Restant: ${Number(avoir.montant_restant || 0).toFixed(2)} CFA`,
//         400,
//         summaryTop + 25,
//         { align: 'right' },
//       );
//       doc.text(
//         `TVA: ${Number(avoir.tva || 0).toFixed(2)} CFA`,
//         400,
//         summaryTop + 40,
//         { align: 'right' },
//       );
//       doc.text(
//         `Précompte BIC: ${Number(avoir.isb || 0).toFixed(2)} CFA`,
//         400,
//         summaryTop + 55,
//         { align: 'right' },
//       );
//       doc.text(
//         `Type de règlement: ${sanitizeString(avoir.type_reglement)}`,
//         400,
//         summaryTop + 70,
//         { align: 'right' },
//       );
//       doc.text('* Montants en francs CFA', 400, summaryTop + 85, {
//         align: 'right',
//       });
//       doc.text(
//         `Arrêté le présent avoir à ${numberToWordsFr(Number(avoir.montant_total || 0))}`,
//         40,
//         summaryTop + 100,
//       );
//       doc.text('Le Gestionnaire', 40, summaryTop + 115, { underline: true });

//       doc
//         .moveTo(40, summaryTop + 130)
//         .lineTo(550, summaryTop + 130)
//         .stroke();
//     } else {
//       // PDF Simplifié
//       doc.fontSize(12);
//       doc.text(
//         `AVOIR N° ${sanitizeString(avoir.numero_facture_certifiee)}`,
//         50,
//         50,
//       );
//       doc.text(
//         `Date: ${avoir.date_avoir ? new Date(avoir.date_avoir).toLocaleString('fr-FR') : 'N/A'}`,
//         50,
//         65,
//       );
//       doc.text(
//         `Client: ${sanitizeString(avoir.client?.nom)} ${sanitizeString(avoir.client?.prenom)}`,
//         50,
//         80,
//       );

//       doc.fontSize(10);
//       const tableTop = 110;
//       const tableLeft = 50;
//       const rowHeight = 20;

//       doc.text('ID Avoir', tableLeft, tableTop, { width: 100 });
//       doc.text('Numéro Facture', tableLeft + 100, tableTop, {
//         width: 150,
//         align: 'center',
//       });
//       doc.text('Montant Total', tableLeft + 250, tableTop, {
//         width: 100,
//         align: 'right',
//       });
//       doc.text('Montant Restant', tableLeft + 350, tableTop, {
//         width: 100,
//         align: 'right',
//       });
//       doc
//         .moveTo(tableLeft, tableTop + 15)
//         .lineTo(450, tableTop + 15)
//         .stroke();

//       const y = tableTop + rowHeight;
//       doc.text(avoir.id_avoir.toString(), tableLeft, y, { width: 100 });
//       doc.text(
//         sanitizeString(avoir.numero_facture_certifiee),
//         tableLeft + 100,
//         y,
//         {
//           width: 150,
//           align: 'center',
//         },
//       );
//       doc.text(
//         Number(avoir.montant_total || 0).toFixed(2),
//         tableLeft + 250,
//         y,
//         {
//           width: 100,
//           align: 'right',
//         },
//       );
//       doc.text(
//         Number(avoir.montant_restant || 0).toFixed(2),
//         tableLeft + 350,
//         y,
//         {
//           width: 100,
//           align: 'right',
//         },
//       );
//       doc
//         .moveTo(tableLeft, y + 15)
//         .lineTo(450, y + 15)
//         .stroke();

//       let totalTop = y + 30;
//       const comments = [
//         avoir.commentaire1,
//         avoir.commentaire2,
//         avoir.commentaire3,
//         avoir.commentaire4,
//         avoir.commentaire5,
//         avoir.commentaire6,
//         avoir.commentaire7,
//         avoir.commentaire8,
//       ].filter((comment) => comment);
//       if (comments.length > 0) {
//         doc.text('Commentaires:', tableLeft, y + 30);
//         totalTop = y + 45;
//         comments.forEach((comment, index) => {
//           doc.text(sanitizeString(comment), tableLeft, y + 45 + index * 15, {
//             width: 400,
//             align: 'left',
//           });
//           totalTop += 15;
//         });
//       }

//       doc.fontSize(12);
//       doc.text(
//         `TOTAL: ${Number(avoir.montant_total || 0).toFixed(2)} CFA`,
//         450,
//         totalTop,
//         {
//           align: 'right',
//         },
//       );
//     }

//     // Finaliser le document
//     console.log('Finalisation du PDF pour avoir', avoirId);
//     doc.end();

//     // Mettre à jour l'avoir
//     avoir.imprimee = 1;
//     await this.avoirRepository.save(avoir);
//   } catch (error) {
//     console.error(
//       'Erreur lors de la génération du PDF:',
//       JSON.stringify(error, null, 2),
//     );
//     if (!res.headersSent) {
//       res.status(500).json({
//         message: `Erreur lors de la génération du PDF: ${error.message}`,
//       });
//     }
//     throw new InternalServerErrorException(
//       `Erreur lors de la génération du PDF: ${error.message}`,
//     );
//   }
// }
