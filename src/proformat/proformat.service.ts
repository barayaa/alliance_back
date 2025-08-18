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
@Injectable()
export class ProformatService {
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
    console.log(dto);

    return this.proformatRepository.manager.transaction(async (manager) => {
      try {
        const client = await manager.findOneBy(Client, {
          id_client: dto.id_client,
        });
        if (!client) {
          throw new BadRequestException(
            `Client avec id ${dto.id_client} non trouvé`,
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
          const isb_ligne = ligne.isb_ligne || montant_ligne * 0.02; // ISB par défaut à 2% si non spécifié
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
          remise: dto.remise,
          validee: 1,
          statut: 0,
          id_client: dto.id_client,
          client,
          reglee: 0,
          moyen_reglement: 0,
          type_reglement: dto.type_reglement || 'E',
          tva: montant_tva,
          type_isb: dto.type_isb || 'A',
          isb: isb_total,
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

        // Initialiser lignes si nécessaire
        if (!savedProformat.lignes) {
          savedProformat.lignes = [];
        }

        for (const ligne of lignesToSave) {
          const ligneEntity = manager.create(LignesProformat, {
            ...ligne,
            id_commande_vente: savedProformat.id_commande_vente, // Utiliser l'ID numérique
          });
          await manager.save(LignesProformat, ligneEntity);
          savedProformat.lignes.push(ligneEntity); // Ajouter après initialisation
        }

        savedProformat.client = client;

        const logEntry = manager.create(Log, {
          log: `Enregistrement de la facture proformat N° ${savedProformat.id_commande_vente}`,
          date: new Date(),
          user: dto.login || 'Utilisateur inconnu',
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
        // Étape 1 : Vérifier que la proforma existe
        const proformat = await manager.findOne(Proformat, {
          where: { id_commande_vente },
          relations: ['client', 'lignes'],
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

        // Étape 3 : Valider type_isb
        const isbs = await manager.find(Isb, { select: ['isb'] });
        const validIsb = isbs.map((isb) => isb.isb.trim().toUpperCase());
        const isbMapping: { [key: string]: string } = {
          A: '0%',
          C: '2%',
          D: '5%',
        };
        const mappedTypeIsb =
          isbMapping[proformat.type_isb.toUpperCase()] ||
          proformat.type_isb.toUpperCase();
        if (!validIsb.includes(mappedTypeIsb)) {
          throw new BadRequestException(
            `Type ISB invalide: ${proformat.type_isb}. Valeurs valides: ${validIsb.join(', ')}`,
          );
        }
        const isbRecord = await manager.findOne(Isb, {
          where: { isb: mappedTypeIsb },
        });
        const isbRate = isbRecord?.taux || 0;

        // Étape 4 : Générer le numéro de séquence pour CommandeVente
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

        // Étape 5 : Créer la CommandeVente
        const commande = manager.create(CommandeVente, {
          date_commande_vente: proformat.date_commande_vente,
          montant_total: proformat.montant_total,
          montant_paye: 0,
          montant_restant: proformat.montant_total,
          remise: proformat.remise,
          validee: 1,
          statut: 0,
          id_client: proformat.id_client,
          client,
          reglee: 0,
          moyen_reglement: 0,
          type_reglement: proformat.type_reglement || 'E',
          tva: proformat.tva,
          type_isb: proformat.type_isb,
          isb: proformat.isb,
          avoir: 0,
          login: proformat.login,
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
          imprimee: 1,
          escompte: 0,
        });

        const savedCommande = await manager.save(CommandeVente, commande);
        console.log(
          `Commande sauvegardée avec id_commande_vente: ${savedCommande.id_commande_vente}`,
        );

        // Étape 6 : Créer les lignes de CommandeVente
        const savedLignes: LignesCommandeVente[] = [];
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
              `Stock insuffisant pour produit ${produit.produit}. Disponible: ${produit.stock_courant}, demandé: ${ligne.quantite}`,
            );
          }

          const ligneDto = {
            id_produit: ligne.designation,
            prix_vente: ligne.prix_vente,
            remise: ligne.remise,
            description_remise: ligne.description_remise,
            prix_vente_avant_remise: ligne.prix_vente_avant_remise,
            quantite: ligne.quantite,
            group_tva: ligne.group_tva,
            etiquette_tva: ligne.etiquette_tva,
            taux_tva: ligne.taux_tva,
            isb_ligne: ligne.isb_ligne,
            date: ligne.date,
          };

          const savedLigne = await this.lignesCommandeVenteService.create(
            ligneDto,
            savedCommande.id_commande_vente,
            login,
          );
          savedLignes.push(savedLigne);
        }

        savedCommande.lignes = savedLignes;

        // Étape 7 : Mettre à jour la proforma
        await manager.update(
          Proformat,
          { id_commande_vente: proformat.id_commande_vente },
          { facture_definitive: 'Oui', statut_proformat: 1 },
        );

        // Étape 8 : Enregistrer un log
        const logEntry = manager.create(Log, {
          log: `Transformation de la proforma N° ${proformat.id_commande_vente} en facture de vente N° ${savedCommande.id_commande_vente}`,
          date: new Date(),
          user: login,
          archive: 1,
        });
        await manager.save(Log, logEntry);

        return savedCommande;
      } catch (error) {
        console.error(
          'Erreur dans la conversion:',
          JSON.stringify(error, null, 2),
        );
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

  async generatePdf(id: number, res: Response): Promise<void> {
    try {
      const proformat = await this.proformatRepository.findOne({
        where: { id_commande_vente: id },
        relations: ['client'],
      });
      if (!proformat) {
        throw new NotFoundException(`Proformat avec id ${id} non trouvé`);
      }

      const lignes = await this.lignesCommandeVenteRepository.find({
        where: { commandeVente: { id_commande_vente: id } },
        relations: ['produit'],
      });

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=proformat_${proformat.numero_facture_certifiee}.pdf`,
      );

      doc.pipe(res);

      // En-tête
      doc.fontSize(20).text('Facture Proforma', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Numéro: ${proformat.numero_facture_certifiee}`, {
        align: 'left',
      });
      doc.text(
        `Date: ${new Date(proformat.date_commande_vente).toLocaleDateString('fr-FR')}`,
        { align: 'left' },
      );
      doc.text(`Client: ${proformat.client?.nom || 'N/A'}`, { align: 'left' });
      doc.text(`Type: ${proformat.type_facture}`, { align: 'left' });
      doc.moveDown();

      // Tableau des lignes
      doc.fontSize(10);
      const tableTop = doc.y;
      const tableLeft = 50;
      const cellPadding = 10;
      const rowHeight = 20;

      // En-têtes du tableau
      doc.text('Produit', tableLeft, tableTop, { width: 200 });
      doc.text('Quantité', tableLeft + 200, tableTop, {
        width: 100,
        align: 'right',
      });
      doc.text('Prix Unitaire', tableLeft + 300, tableTop, {
        width: 100,
        align: 'right',
      });
      doc.text('Total', tableLeft + 400, tableTop, {
        width: 100,
        align: 'right',
      });
      doc.moveDown();

      // Lignes
      lignes.forEach((ligne, index) => {
        const y = tableTop + (index + 1) * rowHeight;
        doc.text(ligne.produit?.produit || 'N/A', tableLeft, y, { width: 200 });
        doc.text(ligne.quantite.toString(), tableLeft + 200, y, {
          width: 100,
          align: 'right',
        });
        doc.text(
          ligne.produit.prix_unitaire?.toFixed(2) || '0.00',
          tableLeft + 300,
          y,
          { width: 100, align: 'right' },
        );
        doc.text(
          (ligne.quantite * (ligne.produit.prix_unitaire || 0)).toFixed(2),
          tableLeft + 400,
          y,
          { width: 100, align: 'right' },
        );
      });

      // Total
      doc.moveDown();
      doc
        .fontSize(12)
        .text(`Montant Total: ${proformat.montant_total.toFixed(2)}`, {
          align: 'right',
        });

      doc.end();
      proformat.imprimee = 1;
      await this.proformatRepository.save(proformat);
      console.log(`PDF généré pour proformat ${id}`);
    } catch (error) {
      console.error(
        'Erreur lors de la génération du PDF:',
        JSON.stringify(error, null, 2),
      );
      throw new BadRequestException(
        `Erreur lors de la génération du PDF: ${error.message}`,
      );
    }
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
