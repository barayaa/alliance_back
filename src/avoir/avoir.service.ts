import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAvoirDto } from './dto/create-avoir.dto';
import { UpdateAvoirDto } from './dto/update-avoir.dto';
import { Avoir } from './entities/avoir.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Client } from 'src/client/client.entity';
import { Produit } from 'src/produit/produit.entity';
import { Isb } from 'src/isb/isb.entity';
import { TypeReglement } from 'src/type_reglement/type_reglement.entity';
import { CommandeVente } from 'src/commande_vente/commande_vente.entity';
import { MMvtStock } from 'src/m_mvt_stock/m_mvt_stock.entity';
import { CaptureStockService } from 'src/capture_stock/capture_stock.service';
import { LigneAvoir } from 'src/ligne_avoir/entities/ligne_avoir.entity';
import { Log } from 'src/log/log.entity';

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
      },
    });
  }
  // async createAvoir(dto: CreateAvoirDto): Promise<Avoir> {
  //   console.log('Payload reçu pour avoir:', JSON.stringify(dto, null, 2));

  //   // Validate login
  //   if (
  //     !dto.login ||
  //     typeof dto.login !== 'string' ||
  //     dto.login.trim() === ''
  //   ) {
  //     throw new BadRequestException(
  //       'Le champ login est requis et doit être une chaîne non vide',
  //     );
  //   }

  //   return this.avoirRepository.manager.transaction(async (manager) => {
  //     try {
  //       // Valider la facture de vente initiale
  //       const factureVente = await manager.findOne(CommandeVente, {
  //         where: {
  //           id_commande_vente: dto.id_facture_vente,
  //           type_facture: 'FV',
  //         },
  //         relations: ['client', 'lignes', 'lignes.produit'],
  //       });
  //       if (!factureVente) {
  //         throw new BadRequestException(
  //           `Facture de vente avec id ${dto.id_facture_vente} non trouvée`,
  //         );
  //       }

  //       // Valider le client
  //       const client = await manager.findOneBy(Client, {
  //         id_client: dto.id_client,
  //       });
  //       if (!client || client.id_client !== factureVente.id_client) {
  //         throw new BadRequestException(
  //           `Client ${dto.id_client} non valide ou ne correspond pas à la facture`,
  //         );
  //       }

  //       // Valider type_isb
  //       const isbs = await manager.find(Isb, { select: ['isb'] });
  //       const validIsb = isbs.map((isb) => isb.isb.trim().toUpperCase());
  //       const isbMapping: { [key: string]: string } = {
  //         A: '0%',
  //         C: '2%',
  //         D: '5%',
  //       };
  //       const mappedTypeIsb =
  //         isbMapping[dto.type_isb?.toUpperCase()] ||
  //         dto.type_isb?.toUpperCase();
  //       if (!dto.type_isb || !validIsb.includes(mappedTypeIsb)) {
  //         throw new BadRequestException(
  //           `Type ISB invalide: ${dto.type_isb}. Valeurs valides: ${validIsb.join(', ')}`,
  //         );
  //       }
  //       const isbRecord = await manager.findOne(Isb, {
  //         where: { isb: mappedTypeIsb },
  //       });
  //       const isbRate: any = isbRecord?.taux || 0;

  //       // Valider type_reglement
  //       const typeReglements = await manager.find(TypeReglement);
  //       const validTypeReglements = typeReglements.map((tr) =>
  //         tr.type_reglement.trim().toUpperCase(),
  //       );
  //       const receivedTypeReglement = dto.type_reglement?.toUpperCase() || 'E';
  //       if (!validTypeReglements.includes(receivedTypeReglement)) {
  //         throw new BadRequestException(
  //           `Type de règlement invalide: ${dto.type_reglement}. Valeurs valides: ${validTypeReglements.join(', ')}`,
  //         );
  //       }

  //       // Valider la remise
  //       if (dto.remise == null || isNaN(dto.remise) || dto.remise < 0) {
  //         throw new BadRequestException(
  //           `Remise invalide: ${dto.remise}. Doit être un nombre positif en CFA`,
  //         );
  //       }

  //       // Générer numero_seq et numero_facture_certifiee
  //       const currentYear = new Date().getFullYear();
  //       const lastAvoir = await manager.findOne(Avoir, {
  //         where: { numero_facture_certifiee: Like(`%-${currentYear}`) },
  //         order: { numero_seq: 'DESC' },
  //       });
  //       const numero_seq = lastAvoir ? lastAvoir.numero_seq + 1 : 1;
  //       const numero_facture_certifiee = `${numero_seq.toString().padStart(4, '0')}-${currentYear}`;

  //       // Vérifier l'unicité
  //       const existingAvoir = await manager.findOne(Avoir, {
  //         where: { numero_facture_certifiee },
  //       });
  //       if (existingAvoir) {
  //         throw new BadRequestException(
  //           `Une facture d'avoir existe déjà avec le numéro ${numero_facture_certifiee}`,
  //         );
  //       }

  //       // Créer l'avoir
  //       const avoir = manager.create(Avoir, {
  //         date_avoir: new Date(dto.date_avoir || new Date()),
  //         montant_total: 0,
  //         montant_restant: 0,
  //         remise: dto.remise || 0,
  //         validee: 1,
  //         statut: 0,
  //         id_client: dto.id_client,
  //         client,
  //         reglee: 0,
  //         moyen_reglement: 0,
  //         type_reglement: receivedTypeReglement,
  //         tva: 0,
  //         type_isb: dto.type_isb,
  //         isb: 0,
  //         login: dto.login,
  //         ref_ini: factureVente.numero_facture_certifiee,
  //         facture_vente: factureVente,
  //         numero_seq,
  //         numero_facture_certifiee,
  //         imprimee: 1,
  //         certifiee: 'NON',
  //         commentaire1:
  //           dto.commentaire1 ||
  //           `Avoir pour facture ${factureVente.numero_facture_certifiee}`,
  //         commentaire2: dto.commentaire2 || '',
  //         commentaire3: dto.commentaire3 || '',
  //         commentaire4: dto.commentaire4 || '',
  //         commentaire5: dto.commentaire5 || '',
  //         commentaire6: dto.commentaire6 || '',
  //         commentaire7: dto.commentaire7 || '',
  //         commentaire8: dto.commentaire8 || '',
  //       });

  //       const savedAvoir = await manager.save(Avoir, avoir);

  //       // Créer les lignes
  //       let subtotal = 0;
  //       let montant_tva = 0;
  //       let isb_total = 0;
  //       const savedLignes: LigneAvoir[] = [];

  //       for (const ligne of dto.lignes) {
  //         const ligneOriginale = factureVente.lignes.find(
  //           (l) => l.designation === ligne.id_produit,
  //         );
  //         if (!ligneOriginale) {
  //           throw new BadRequestException(
  //             `Produit ${ligne.id_produit} non présent dans la facture initiale`,
  //           );
  //         }
  //         if (ligne.quantite > ligneOriginale.quantite) {
  //           throw new BadRequestException(
  //             `Quantité ${ligne.quantite} pour produit ${ligne.id_produit} dépasse la quantité initiale ${ligneOriginale.quantite}`,
  //           );
  //         }

  //         const produit = await manager.findOneBy(Produit, {
  //           id_produit: ligne.id_produit,
  //         });
  //         if (!produit) {
  //           throw new BadRequestException(
  //             `Produit avec id ${ligne.id_produit} non trouvé`,
  //           );
  //         }

  //         const prix_vente = ligneOriginale.prix_vente;
  //         const remise = ligne.remise ?? ligneOriginale.remise;
  //         const montant_ligne = prix_vente * ligne.quantite * (1 - remise);
  //         const taux_tva = ligneOriginale.taux_tva;
  //         const montant_tva_ligne = montant_ligne * (taux_tva / 100);
  //         const isb_ligne = ligne.isb_ligne ?? montant_ligne * isbRate;

  //         subtotal += montant_ligne;
  //         montant_tva += montant_tva_ligne;
  //         isb_total += isb_ligne;

  //         const ligneAvoir = manager.create(LigneAvoir, {
  //           id_avoir: savedAvoir.id_avoir,
  //           avoir: savedAvoir,
  //           designation: ligne.id_produit,
  //           produit,
  //           prix_vente,
  //           remise,
  //           description_remise: ligne.description_remise || 'Avoir',
  //           prix_vente_avant_remise: prix_vente.toString(),
  //           quantite: ligne.quantite,
  //           montant: montant_ligne,
  //           group_tva: ligneOriginale.group_tva,
  //           etiquette_tva: ligneOriginale.etiquette_tva,
  //           taux_tva,
  //           montant_tva: montant_tva_ligne,
  //           isb_ligne,
  //           date: dto.date_avoir || new Date().toISOString().split('T')[0],
  //           stock_avant: produit.stock_courant,
  //           stock_apres: produit.stock_courant + ligne.quantite,
  //           retour: 0,
  //         });

  //         const savedLigne = await manager.save(LigneAvoir, ligneAvoir);
  //         savedLignes.push(savedLigne);

  //         // Restaurer le stock
  //         await manager.update(
  //           Produit,
  //           { id_produit: ligne.id_produit },
  //           { stock_courant: produit.stock_courant + ligne.quantite },
  //         );

  //         // Enregistrer le mouvement de stock
  //         const mvtStock = manager.create(MMvtStock, {
  //           id_produit: ligne.id_produit,
  //           quantite: ligne.quantite,
  //           quantite_commandee: 0,
  //           cout: produit.prix_unitaire || 0,
  //           date: new Date(),
  //           user: dto.login.trim(),
  //           type: 1,
  //           magasin: 1,
  //           commentaire: `Retour via avoir ${savedAvoir.id_avoir}`,
  //           stock_avant: produit.stock_courant,
  //           stock_apres: produit.stock_courant + ligne.quantite,
  //           id_commande_vente: factureVente.id_commande_vente,
  //           annule: 'N',
  //           num_lot: '',
  //           date_expiration: null,
  //           conformite: 'O',
  //         });
  //         await manager.save(MMvtStock, mvtStock);

  //         await this.captureStockService.updateStockCapture(
  //           ligne.id_produit,
  //           produit.stock_courant + ligne.quantite,
  //         );
  //       }

  //       // Mettre à jour les montants
  //       const montant_total =
  //         subtotal + montant_tva + isb_total - (dto.remise || 0);
  //       await manager.update(
  //         Avoir,
  //         { id_avoir: savedAvoir.id_avoir },
  //         {
  //           montant_total,
  //           montant_restant: montant_total,
  //           tva: montant_tva,
  //           isb: isb_total,
  //         },
  //       );

  //       // Mettre à jour la facture initiale
  //       const montantRestantFacture = Math.max(
  //         0,
  //         factureVente.montant_restant - montant_total,
  //       );
  //       await manager.update(
  //         CommandeVente,
  //         { id_commande_vente: factureVente.id_commande_vente },
  //         { montant_restant: montantRestantFacture },
  //       );

  //       // Enregistrer le log
  //       const logEntry = manager.create(Log, {
  //         log: `Enregistrement de la facture d'avoir N° ${savedAvoir.id_avoir} pour facture ${factureVente.numero_facture_certifiee}`,
  //         date: new Date(),
  //         user: dto.login.trim(),
  //         archive: 1,
  //       });
  //       await manager.save(Log, logEntry);

  //       // Recharger l'avoir avec les relations
  //       const finalAvoir = await manager.findOne(Avoir, {
  //         where: { id_avoir: savedAvoir.id_avoir },
  //         relations: ['client', 'facture_vente', 'lignes', 'lignes.produit'],
  //       });

  //       return finalAvoir;
  //     } catch (error) {
  //       console.error(
  //         'Erreur dans la transaction:',
  //         JSON.stringify(error, null, 2),
  //       );
  //       throw error;
  //     }
  //   });
  // }

  async createAvoir(dto: CreateAvoirDto): Promise<Avoir> {
    console.log('Payload reçu pour avoir:', JSON.stringify(dto, null, 2));

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
            `Avoir pour facture ${factureVente.numero_facture_certifiee}`,
          commentaire2: dto.commentaire2 || '',
          commentaire3: dto.commentaire3 || '',
          commentaire4: dto.commentaire4 || '',
          commentaire5: dto.commentaire5 || '',
          commentaire6: dto.commentaire6 || '',
          commentaire7: dto.commentaire7 || '',
          commentaire8: dto.commentaire8 || '',
        });

        const savedAvoir = await manager.save(Avoir, avoir);

        // Calcul des lignes avec gestion des remises
        let subtotal = 0;
        let montant_tva = 0;
        let isb_total = 0;
        const savedLignes: LigneAvoir[] = [];

        for (const ligne of dto.lignes) {
          const ligneOriginale = factureVente.lignes.find(
            (l) => l.designation === ligne.id_produit,
          );
          if (!ligneOriginale) {
            throw new BadRequestException(
              `Produit ${ligne.id_produit} non présent dans la facture initiale`,
            );
          }
          if (ligne.quantite > ligneOriginale.quantite) {
            throw new BadRequestException(
              `Quantité ${ligne.quantite} pour produit ${ligne.id_produit} dépasse la quantité initiale ${ligneOriginale.quantite}`,
            );
          }

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

          // Calcul du montant de la ligne avec la remise
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
              `Le montant de la ligne pour le produit ${ligne.id_produit} (${montant_ligne}) dépasse le montant initial (${montant_ligne_initial})`,
            );
          }

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

          await this.captureStockService.updateStockCapture(
            ligne.id_produit,
            produit.stock_courant + ligne.quantite,
          );
        }

        // Calcul du montant total de l'avoir
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

        // Mettre à jour l'avoir
        await manager.update(
          Avoir,
          { id_avoir: savedAvoir.id_avoir },
          {
            montant_total: montant_final_avoir,
            montant_restant: montant_final_avoir, // Représente le crédit à rembourser au client
            tva: montant_tva,
            isb: isb_total,
          },
        );

        // Mettre à jour la facture initiale
        const nouveauMontantTotal =
          factureVente.montant_total - montant_final_avoir;
        const nouveauMontantRestant =
          factureVente.montant_restant - montant_final_avoir;

        await manager.update(
          CommandeVente,
          { id_commande_vente: factureVente.id_commande_vente },
          {
            montant_total: nouveauMontantTotal,
            montant_restant: nouveauMontantRestant, // Peut être négatif pour indiquer un crédit
            avoir: 1, // Indiquer que la facture a un avoir
          },
        );

        // Si la facture est réglée, ajuster le solde du client
        if (factureVente.montant_restant <= 0) {
          const client = await manager.findOneBy(Client, {
            id_client: factureVente.id_client,
          });
          if (client) {
            const nouveauSolde = (client.avance || 0) + montant_final_avoir;
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

        // Enregistrer le log
        const logEntry = manager.create(Log, {
          log: `Enregistrement de la facture d'avoir N° ${savedAvoir.id_avoir} pour facture ${factureVente.numero_facture_certifiee} (montant: ${montant_final_avoir})`,
          date: new Date(),
          user: dto.login.trim(),
          archive: 1,
        });
        await manager.save(Log, logEntry);

        // Recharger l'avoir avec les relations
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

  //grok

  // async createAvoir(dto: CreateAvoirDto): Promise<Avoir> {
  //   console.log('Payload reçu pour avoir:', JSON.stringify(dto, null, 2));

  //   // Validation des champs (inchangé)
  //   if (
  //     !dto.login ||
  //     typeof dto.login !== 'string' ||
  //     dto.login.trim() === ''
  //   ) {
  //     throw new BadRequestException(
  //       'Le champ login est requis et doit être une chaîne non vide',
  //     );
  //   }

  //   return this.avoirRepository.manager.transaction(async (manager) => {
  //     try {
  //       // Valider la facture de vente initiale
  //       const factureVente = await manager.findOne(CommandeVente, {
  //         where: {
  //           id_commande_vente: dto.id_facture_vente,
  //           type_facture: 'FV',
  //         },
  //         relations: ['client', 'lignes', 'lignes.produit'],
  //       });
  //       if (!factureVente) {
  //         throw new BadRequestException(
  //           `Facture de vente avec id ${dto.id_facture_vente} non trouvée`,
  //         );
  //       }

  //       // Valider le client (inchangé)
  //       const client = await manager.findOneBy(Client, {
  //         id_client: dto.id_client,
  //       });
  //       if (!client || client.id_client !== factureVente.id_client) {
  //         throw new BadRequestException(
  //           `Client ${dto.id_client} non valide ou ne correspond pas à la facture`,
  //         );
  //       }

  //       // Valider type_isb (inchangé)
  //       const isbs = await manager.find(Isb, { select: ['isb'] });
  //       const validIsb = isbs.map((isb) => isb.isb.trim().toUpperCase());
  //       const isbMapping: { [key: string]: string } = {
  //         A: '0%',
  //         C: '2%',
  //         D: '5%',
  //       };
  //       const mappedTypeIsb =
  //         isbMapping[dto.type_isb?.toUpperCase()] ||
  //         dto.type_isb?.toUpperCase();
  //       if (!dto.type_isb || !validIsb.includes(mappedTypeIsb)) {
  //         throw new BadRequestException(
  //           `Type ISB invalide: ${dto.type_isb}. Valeurs valides: ${validIsb.join(', ')}`,
  //         );
  //       }
  //       const isbRecord = await manager.findOne(Isb, {
  //         where: { isb: mappedTypeIsb },
  //       });
  //       const isbRate: any = isbRecord?.taux || 0;

  //       // Valider type_reglement (inchangé)
  //       const typeReglements = await manager.find(TypeReglement);
  //       const validTypeReglements = typeReglements.map((tr) =>
  //         tr.type_reglement.trim().toUpperCase(),
  //       );
  //       const receivedTypeReglement = dto.type_reglement?.toUpperCase() || 'E';
  //       if (!validTypeReglements.includes(receivedTypeReglement)) {
  //         throw new BadRequestException(
  //           `Type de règlement invalide: ${dto.type_reglement}. Valeurs valides: ${validTypeReglements.join(', ')}`,
  //         );
  //       }

  //       // Valider la remise globale
  //       if (dto.remise == null || isNaN(dto.remise) || dto.remise < 0) {
  //         throw new BadRequestException(
  //           `Remise invalide: ${dto.remise}. Doit être un nombre positif en CFA`,
  //         );
  //       }

  //       // Générer numero_seq et numero_facture_certifiee (inchangé)
  //       const currentYear = new Date().getFullYear();
  //       const lastAvoir = await manager.findOne(Avoir, {
  //         where: { numero_facture_certifiee: Like(`%-${currentYear}`) },
  //         order: { numero_seq: 'DESC' },
  //       });
  //       const numero_seq = lastAvoir ? lastAvoir.numero_seq + 1 : 1;
  //       const numero_facture_certifiee = `${numero_seq.toString().padStart(4, '0')}-${currentYear}`;

  //       // Vérifier l'unicité (inchangé)
  //       const existingAvoir = await manager.findOne(Avoir, {
  //         where: { numero_facture_certifiee },
  //       });
  //       if (existingAvoir) {
  //         throw new BadRequestException(
  //           `Une facture d'avoir existe déjà avec le numéro ${numero_facture_certifiee}`,
  //         );
  //       }

  //       // Créer l'avoir (inchangé)
  //       const avoir = manager.create(Avoir, {
  //         date_avoir: new Date(dto.date_avoir || new Date()),
  //         montant_total: 0,
  //         montant_restant: 0,
  //         remise: dto.remise || 0,
  //         validee: 1,
  //         statut: 0,
  //         id_client: dto.id_client,
  //         client,
  //         reglee: 0,
  //         moyen_reglement: 0,
  //         type_reglement: receivedTypeReglement,
  //         tva: 0,
  //         type_isb: dto.type_isb,
  //         isb: 0,
  //         login: dto.login,
  //         ref_ini: factureVente.numero_facture_certifiee,
  //         facture_vente: factureVente,
  //         numero_seq,
  //         numero_facture_certifiee,
  //         imprimee: 1,
  //         certifiee: 'NON',
  //         commentaire1:
  //           dto.commentaire1 ||
  //           `Avoir pour facture ${factureVente.numero_facture_certifiee}`,
  //         commentaire2: dto.commentaire2 || '',
  //         commentaire3: dto.commentaire3 || '',
  //         commentaire4: dto.commentaire4 || '',
  //         commentaire5: dto.commentaire5 || '',
  //         commentaire6: dto.commentaire6 || '',
  //         commentaire7: dto.commentaire7 || '',
  //         commentaire8: dto.commentaire8 || '',
  //       });

  //       const savedAvoir = await manager.save(Avoir, avoir);

  //       // Calcul des lignes avec gestion des remises
  //       let subtotal = 0;
  //       let montant_tva = 0;
  //       let isb_total = 0;
  //       const savedLignes: LigneAvoir[] = [];

  //       for (const ligne of dto.lignes) {
  //         const ligneOriginale = factureVente.lignes.find(
  //           (l) => l.designation === ligne.id_produit,
  //         );
  //         if (!ligneOriginale) {
  //           throw new BadRequestException(
  //             `Produit ${ligne.id_produit} non présent dans la facture initiale`,
  //           );
  //         }
  //         if (ligne.quantite > ligneOriginale.quantite) {
  //           throw new BadRequestException(
  //             `Quantité ${ligne.quantite} pour produit ${ligne.id_produit} dépasse la quantité initiale ${ligneOriginale.quantite}`,
  //           );
  //         }

  //         const produit = await manager.findOneBy(Produit, {
  //           id_produit: ligne.id_produit,
  //         });
  //         if (!produit) {
  //           throw new BadRequestException(
  //             `Produit avec id ${ligne.id_produit} non trouvé`,
  //           );
  //         }

  //         // Calcul de la remise au niveau de la ligne
  //         const prix_vente = ligneOriginale.prix_vente;
  //         const remise = ligne.remise ?? ligneOriginale.remise;
  //         if (remise < 0 || remise > 1) {
  //           throw new BadRequestException(
  //             `Remise pour produit ${ligne.id_produit} invalide: ${remise}. Doit être entre 0 et 1`,
  //           );
  //         }

  //         // Calcul du montant de la ligne
  //         const montant_ligne = prix_vente * ligne.quantite * (1 - remise);
  //         const taux_tva = ligneOriginale.taux_tva;
  //         const montant_tva_ligne = montant_ligne * (taux_tva / 100);
  //         const isb_ligne = ligne.isb_ligne ?? montant_ligne * isbRate;

  //         subtotal += montant_ligne;
  //         montant_tva += montant_tva_ligne;
  //         isb_total += isb_ligne;

  //         // Créer la ligne d'avoir
  //         const ligneAvoir = manager.create(LigneAvoir, {
  //           id_avoir: savedAvoir.id_avoir,
  //           avoir: savedAvoir,
  //           designation: ligne.id_produit,
  //           produit,
  //           prix_vente,
  //           remise,
  //           description_remise: ligne.description_remise || 'Avoir',
  //           prix_vente_avant_remise: prix_vente.toString(),
  //           quantite: ligne.quantite,
  //           montant: montant_ligne,
  //           group_tva: ligneOriginale.group_tva,
  //           etiquette_tva: ligneOriginale.etiquette_tva,
  //           taux_tva,
  //           montant_tva: montant_tva_ligne,
  //           isb_ligne,
  //           date: dto.date_avoir || new Date().toISOString().split('T')[0],
  //           stock_avant: produit.stock_courant,
  //           stock_apres: produit.stock_courant + ligne.quantite,
  //           retour: 0,
  //         });

  //         const savedLigne = await manager.save(LigneAvoir, ligneAvoir);
  //         savedLignes.push(savedLigne);

  //         // Restaurer le stock
  //         await manager.update(
  //           Produit,
  //           { id_produit: ligne.id_produit },
  //           { stock_courant: produit.stock_courant + ligne.quantite },
  //         );

  //         // Enregistrer le mouvement de stock
  //         const mvtStock = manager.create(MMvtStock, {
  //           id_produit: ligne.id_produit,
  //           quantite: ligne.quantite,
  //           quantite_commandee: 0,
  //           cout: produit.prix_unitaire || 0,
  //           date: new Date(),
  //           user: dto.login.trim(),
  //           type: 1,
  //           magasin: 1,
  //           commentaire: `Retour via avoir ${savedAvoir.id_avoir}`,
  //           stock_avant: produit.stock_courant,
  //           stock_apres: produit.stock_courant + ligne.quantite,
  //           id_commande_vente: factureVente.id_commande_vente,
  //           annule: 'N',
  //           num_lot: '',
  //           date_expiration: null,
  //           conformite: 'O',
  //         });
  //         await manager.save(MMvtStock, mvtStock);

  //         await this.captureStockService.updateStockCapture(
  //           ligne.id_produit,
  //           produit.stock_courant + ligne.quantite,
  //         );
  //       }

  //       // Calcul du montant total de l'avoir
  //       const montant_total_avoir = subtotal + montant_tva + isb_total;
  //       const remise_globale = dto.remise || 0;

  //       // Vérifier que la remise globale est valide
  //       if (remise_globale > montant_total_avoir) {
  //         throw new BadRequestException(
  //           `La remise globale (${remise_globale}) dépasse le montant total de l'avoir (${montant_total_avoir})`,
  //         );
  //       }

  //       const montant_final_avoir = montant_total_avoir - remise_globale;

  //       // Mettre à jour l'avoir
  //       await manager.update(
  //         Avoir,
  //         { id_avoir: savedAvoir.id_avoir },
  //         {
  //           montant_total: montant_final_avoir,
  //           montant_restant: montant_final_avoir,
  //           tva: montant_tva,
  //           isb: isb_total,
  //         },
  //       );

  //       // Vérifier que l'avoir ne dépasse pas le montant restant de la facture
  //       if (montant_final_avoir > factureVente.montant_restant) {
  //         throw new BadRequestException(
  //           `Le montant de l'avoir (${montant_final_avoir}) dépasse le montant restant de la facture (${factureVente.montant_restant})`,
  //         );
  //       }

  //       // Mettre à jour la facture initiale
  //       const montantRestantFacture = Math.max(
  //         0,
  //         factureVente.montant_restant - montant_final_avoir,
  //       );
  //       await manager.update(
  //         CommandeVente,
  //         { id_commande_vente: factureVente.id_commande_vente },
  //         { montant_restant: montantRestantFacture },
  //       );

  //       // Enregistrer le log
  //       const logEntry = manager.create(Log, {
  //         log: `Enregistrement de la facture d'avoir N° ${savedAvoir.id_avoir} pour facture ${factureVente.numero_facture_certifiee}`,
  //         date: new Date(),
  //         user: dto.login.trim(),
  //         archive: 1,
  //       });
  //       await manager.save(Log, logEntry);

  //       // Recharger l'avoir avec les relations
  //       const finalAvoir = await manager.findOne(Avoir, {
  //         where: { id_avoir: savedAvoir.id_avoir },
  //         relations: ['client', 'facture_vente', 'lignes', 'lignes.produit'],
  //       });

  //       return finalAvoir;
  //     } catch (error) {
  //       console.error(
  //         'Erreur dans la transaction:',
  //         JSON.stringify(error, null, 2),
  //       );
  //       throw error;
  //     }
  //   });
  // }
}
