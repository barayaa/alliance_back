import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
  Inject,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, EntityManager } from 'typeorm';
import { CommandeAchat } from './commande_achat.entity';
import { TitulaireAmm } from '../titulaire_amm/titulaire_amm.entity';
import { Destination } from '../destination/destination.entity';
import { Produit } from '../produit/produit.entity';
import { LignesCommandeAchat } from '../lignes_commande_achat/lignes_commande_achat.entity';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';
import { CreateCommandeAchatDto } from './dto/create-commande_achat.dto';
import { UpdateCommandeAchatDto } from './dto/update-commande_achat.dto';
import { User } from '../user/user.entity';
import { LignesCommandeAchatService } from '../lignes_commande_achat/lignes_commande_achat.service';
import { Log } from 'src/log/log.entity';
import { Fournisseur } from 'src/fournisseur/fournisseur.entity';
import * as XLSX from 'xlsx';
import { Response } from 'express';
// interface StockConsistency {
//   id_produit: number;
//   nom_produit: string;
//   stock_courant: number;
//   total_achats: number;
//   total_ventes: number;
//   stock_calcule: number;
//   difference: number;
// }

@Injectable()
export class CommandeAchatService {
  constructor(
    @InjectRepository(CommandeAchat)
    private commande_achatRepository: Repository<CommandeAchat>,
    @InjectRepository(TitulaireAmm)
    private titulaireAmmRepository: Repository<TitulaireAmm>,
    @InjectRepository(Destination)
    private destinationRepository: Repository<Destination>,
    @Inject(forwardRef(() => LignesCommandeAchatService))
    private lignesCommandeAchatService: LignesCommandeAchatService,
    @InjectRepository(MMvtStock)
    private mvtStockRepository: Repository<MMvtStock>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(LignesCommandeAchat)
    private lignesCommandeAchatRepository: Repository<LignesCommandeAchat>,
    @InjectRepository(LignesCommandeVente)
    private lignesCommandeVenteRepository: Repository<LignesCommandeVente>,
  ) {}

  async findAll(
    date_debut?: string,
    date_fin?: string,
    reference?: string,
  ): Promise<CommandeAchat[]> {
    console.log('Filtres reçus:', { date_debut, date_fin, reference });
    const where: any = {};

    if (date_debut && date_fin) {
      const startDate = new Date(date_debut);
      const endDate = new Date(date_fin);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Dates invalides');
      }
      endDate.setHours(23, 59, 59, 999); // Inclure toute la journée
      where.date_commande_achat = Between(startDate, endDate);
    }

    if (reference) {
      where.reference = Like(`%${reference}%`);
    }

    try {
      const commandes = await this.commande_achatRepository.find({
        where,
        relations: ['fournisseur', 'destination', 'lignes', 'lignes.produit'], // Ajout de lignes.produit
      });
      console.log('Commandes trouvées:', JSON.stringify(commandes, null, 2));
      return commandes;
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      throw new BadRequestException(
        `Erreur lors de la récupération des commandes d'achat : ${error.message}`,
      );
    }
  }

  async findOne(id: number): Promise<CommandeAchat> {
    try {
      const commande = await this.commande_achatRepository.findOne({
        where: { id_commande_achat: id },
        relations: ['fournisseur', 'destination', 'lignes', 'lignes.produit'], // Changé ici aussi
      });
      if (!commande) {
        throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
      }
      return commande;
    } catch (error) {
      console.error('Erreur lors de la récupération de la commande:', error);
      throw new BadRequestException(
        `Erreur lors de la récupération de la commande ${id} : ${error.message}`,
      );
    }
  }

  // async create(
  //   dto: CreateCommandeAchatDto,
  //   user: User,
  // ): Promise<CommandeAchat> {
  //   if (!user) {
  //     throw new UnauthorizedException('Utilisateur non authentifié');
  //   }

  //   return await this.commande_achatRepository.manager.transaction(
  //     async (transactionalEntityManager: EntityManager) => {
  //       // Vérification du fournisseur
  //       const fournisseur = await transactionalEntityManager.findOne(
  //         Fournisseur,
  //         {
  //           where: { id_fournisseur: dto.id_fournisseur },
  //         },
  //       );
  //       if (!fournisseur) {
  //         throw new NotFoundException(
  //           `Fournisseur avec l'ID ${dto.id_fournisseur} non trouvé`,
  //         );
  //       }

  //       // DEBUG: Log fournisseur to check if it has an ID
  //       console.log('Fournisseur found:', fournisseur);
  //       console.log('Fournisseur ID:', fournisseur.id_fournisseur);

  //       // Vérification de la destination
  //       const destination = await transactionalEntityManager.findOne(
  //         Destination,
  //         {
  //           where: { id_destination: dto.id_destination },
  //         },
  //       );
  //       if (!destination) {
  //         throw new NotFoundException(
  //           `Destination avec l'ID ${dto.id_destination} non trouvée`,
  //         );
  //       }

  //       // DEBUG: Log destination to check if it has an ID
  //       console.log('Destination found:', destination);
  //       console.log('Destination ID:', destination.id_destination);

  //       // Calcul du montant total
  //       const montantTotal = dto.produits.reduce(
  //         (sum, produit) =>
  //           sum +
  //           (produit.pu
  //             ? produit.pu *
  //               produit.quantite *
  //               (1 - (produit.remise || 0) / 100)
  //             : 0),
  //         0,
  //       );

  //       // SOLUTION 1: Use raw insert with foreign key IDs instead of entity objects
  //       try {
  //         const commandeData = {
  //           date_commande_achat: new Date(dto.date_commande_achat),
  //           montant_total: montantTotal,
  //           montant_paye: dto.montant_paye || 0,
  //           montant_restant: montantTotal - (dto.montant_paye || 0),
  //           validee: dto.validee !== undefined ? dto.validee : 1,
  //           statut: dto.statut !== undefined ? dto.statut : 0,
  //           reglee: dto.reglee !== undefined ? dto.reglee : 0,
  //           moyen_reglement: dto.moyen_reglement || 0,
  //           type_reglement: dto.type_reglement || 0,
  //           tva: dto.tva || 0,
  //           avoir: dto.avoir !== undefined ? dto.avoir : 0,
  //           reference: dto.reference,
  //           user: user.nom,
  //           // Use foreign key IDs instead of entity objects
  //           id_fournisseur: fournisseur.id_fournisseur,
  //           id_destination: destination.id_destination,
  //         };

  //         console.log('Commande data to insert:', commandeData);

  //         // Use QueryBuilder for raw insert
  //         const result = await transactionalEntityManager
  //           .createQueryBuilder()
  //           .insert()
  //           .into(CommandeAchat)
  //           .values(commandeData)
  //           .execute();

  //         console.log('Insert result:', result);

  //         // Fetch the created entity with relations
  //         const savedCommande = await transactionalEntityManager.findOne(
  //           CommandeAchat,
  //           {
  //             where: {
  //               id_commande_achat: result.identifiers[0].id_commande_achat,
  //             },
  //             relations: ['fournisseur', 'destination'],
  //           },
  //         );

  //         if (!savedCommande) {
  //           throw new Error('Failed to create and retrieve commande');
  //         }

  //         // Rest of your logic for creating lines and updating products
  //         for (const produit of dto.produits) {
  //           await this.lignesCommandeAchatService.create(
  //             {
  //               ...produit,
  //               id_commande_achat: savedCommande.id_commande_achat,
  //               date: new Date(dto.date_commande_achat),
  //             },
  //             user.nom,
  //             savedCommande.reference,
  //             dto.id_destination,
  //             transactionalEntityManager,
  //           );

  //           const produitToUpdate = await transactionalEntityManager.findOne(
  //             Produit,
  //             {
  //               where: { id_produit: produit.designation },
  //             },
  //           );

  //           if (produitToUpdate) {
  //             produitToUpdate.validite_amm = produit.date_expiration;
  //             produitToUpdate.pght = produit.pght;
  //             produitToUpdate.prix_unitaire = produit.prix_vente;

  //             await transactionalEntityManager.save(Produit, produitToUpdate);
  //           } else {
  //             throw new NotFoundException(
  //               `Produit avec l'ID ${produit.designation} non trouvé`,
  //             );
  //           }
  //         }

  //         return savedCommande;
  //       } catch (error) {
  //         console.error('Error during commande creation:', error);
  //         throw error;
  //       }
  //     },
  //   );
  // }

  async create(
    dto: CreateCommandeAchatDto,
    user: User,
  ): Promise<CommandeAchat> {
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    return await this.commande_achatRepository.manager.transaction(
      async (transactionalEntityManager: EntityManager) => {
        // Vérification du fournisseur
        const fournisseur = await transactionalEntityManager.findOne(
          Fournisseur,
          {
            where: { id_fournisseur: dto.id_fournisseur },
          },
        );
        if (!fournisseur) {
          throw new NotFoundException(
            `Fournisseur avec l'ID ${dto.id_fournisseur} non trouvé`,
          );
        }

        // Vérification de la destination
        const destination = await transactionalEntityManager.findOne(
          Destination,
          {
            where: { id_destination: dto.id_destination },
          },
        );
        if (!destination) {
          throw new NotFoundException(
            `Destination avec l'ID ${dto.id_destination} non trouvée`,
          );
        }

        // Calcul du montant total
        const montantTotal = dto.produits.reduce(
          (sum, produit) =>
            sum +
            (produit.pu
              ? produit.pu *
                produit.quantite *
                (1 - (produit.remise || 0) / 100)
              : 0),
          0,
        );

        // Création de la commande
        const commande = transactionalEntityManager.create(CommandeAchat, {
          date_commande_achat: new Date(dto.date_commande_achat),
          montant_total: montantTotal,
          montant_paye: dto.montant_paye || 0,
          montant_restant: montantTotal - (dto.montant_paye || 0),
          validee: dto.validee || 1,
          statut: dto.statut || 0,
          fournisseur, // Assigner l'entité Fournisseur
          reglee: dto.reglee || 0,
          moyen_reglement: dto.moyen_reglement || 0,
          type_reglement: dto.type_reglement || 0,
          tva: dto.tva || 0,
          avoir: dto.avoir || 0,
          reference: dto.reference,
          user: user.nom,
          destination,
        });

        // Sauvegarde de la commande
        const savedCommande = await transactionalEntityManager.save(
          CommandeAchat,
          commande,
        );

        // Création des lignes de commande et mise à jour des produits
        for (const produit of dto.produits) {
          // Création de la ligne de commande
          await this.lignesCommandeAchatService.create(
            {
              ...produit,
              id_commande_achat: savedCommande.id_commande_achat,
              date: new Date(dto.date_commande_achat),
            },
            user.nom,
            savedCommande.reference,
            dto.id_destination,
            transactionalEntityManager,
          );

          // Mise à jour du produit dans la table produit
          const produitToUpdate = await transactionalEntityManager.findOne(
            Produit,
            {
              where: { id_produit: produit.designation },
            },
          );

          if (produitToUpdate) {
            //  produitToUpdate.cle_titulaire_amm = dto.id_fournisseur;
            // produitToUpdate.cle_fournisseur = dto.id_fournisseur;
            // // Changé de cle_titulaire_amm à cle_fournisseur
            produitToUpdate.validite_amm = produit.date_expiration;
            produitToUpdate.pght = produit.pght;
            produitToUpdate.prix_unitaire = produit.prix_vente;
            await transactionalEntityManager.save(Produit, produitToUpdate);
          } else {
            throw new NotFoundException(
              `Produit avec l'ID ${produit.designation} non trouvé`,
            );
          }
        }

        return savedCommande;
      },
    );
  }

  async update(
    id: number,
    dto: UpdateCommandeAchatDto,
  ): Promise<CommandeAchat> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.commande_achatRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.commande_achatRepository.remove(entity);
  }

  async cancel(id: number): Promise<void> {
    if (!id || isNaN(id)) {
      throw new BadRequestException('ID de commande invalide');
    }
    const commande = await this.findOne(id);
    if (commande.statut === 2) {
      throw new BadRequestException('Commande déjà annulée');
    }
    commande.statut = 2;
    await this.commande_achatRepository.save(commande);
    console.log(`Commande ${id} annulée`);
  }

  // async checkStockAllProducts(login: string): Promise<StockConsistency[]> {
  //   return await this.produitRepository.manager.transaction(
  //     async (manager: EntityManager) => {
  //       try {
  //         const produits = await manager.find(Produit);

  //         const result: StockConsistency[] = [];
  //         for (const produit of produits) {
  //           const totalAchats = await manager
  //             .createQueryBuilder(LignesCommandeAchat, 'lca')
  //             .select('SUM(lca.quantite)', 'total')
  //             .where('lca.designation = :idProduit', {
  //               idProduit: produit.id_produit,
  //             })
  //             .getRawOne();

  //           const totalVentes = await manager
  //             .createQueryBuilder(LignesCommandeVente, 'lcv')
  //             .select('SUM(lcv.quantite)', 'total')
  //             .where('lcv.designation = :idProduit', {
  //               idProduit: produit.id_produit,
  //             })
  //             .getRawOne();

  //           const total_achats = Number(totalAchats?.total) || 0;
  //           const total_ventes = Number(totalVentes?.total) || 0;
  //           const stock_calcule = total_achats - total_ventes;
  //           const difference = produit.stock_courant - stock_calcule;

  //           const original_stock_courant = produit.stock_courant;
  //           let error: string | undefined;

  //           if (difference !== 0) {
  //             // Gérer le stock négatif
  //             const new_stock_courant = stock_calcule < 0 ? 0 : stock_calcule;

  //             // Mettre à jour stock_courant
  //             await manager.update(
  //               Produit,
  //               { id_produit: produit.id_produit },
  //               { stock_courant: new_stock_courant },
  //             );

  //             // Créer MMvtStock seulement si quantite != 0
  //             const quantite = new_stock_courant - original_stock_courant;
  //             if (quantite !== 0) {
  //               const mvtStock = manager.create(MMvtStock, {
  //                 id_produit: produit.id_produit,
  //                 quantite,
  //                 quantite_commandee: 0,
  //                 cout: produit.prix_unitaire || 0,
  //                 date: new Date(),
  //                 user: login || 'Inconnu',
  //                 type: 4, // Toujours 4 pour les corrections
  //                 magasin: 1,
  //                 commentaire: `Correction de stock pour produit ${produit.id_produit} (${produit.produit}) : de ${original_stock_courant} à ${new_stock_courant}${stock_calcule < 0 ? ' (stock négatif ${stock_calcule} forcé à 0)' : ''}`,
  //                 stock_avant: original_stock_courant,
  //                 stock_apres: new_stock_courant,
  //                 id_commande_achat: 0,
  //                 id_commande_vente: 0,
  //                 annule: 'N',
  //                 num_lot: '',
  //                 date_expiration: null,
  //                 conformite: 'O',
  //               });
  //               await manager.save(MMvtStock, mvtStock);

  //               // Enregistrer un log de correction
  //               const logEntry = manager.create(Log, {
  //                 log: `Correction de stock pour produit ${produit.id_produit} (${produit.produit}) : de ${original_stock_courant} à ${new_stock_courant}${stock_calcule < 0 ? ' (stock négatif ${stock_calcule} forcé à 0)' : ''} par ${login}`,
  //                 date: new Date(),
  //                 user: login || 'Inconnu',
  //                 archive: 1,
  //               });
  //               await manager.save(Log, logEntry);
  //             }

  //             // Notifier l'anomalie si stock_calcule < 0
  //             if (stock_calcule < 0) {
  //               error = `Stock calculé négatif (${stock_calcule}), forcé à 0`;
  //               const errorLog = manager.create(Log, {
  //                 log: `Anomalie détectée pour produit ${produit.id_produit} (${produit.produit}) : stock calculé négatif (${stock_calcule}), forcé à 0 par ${login}`,
  //                 date: new Date(),
  //                 user: login || 'Inconnu',
  //                 archive: 1,
  //               });
  //               await manager.save(Log, errorLog);
  //             }
  //           }

  //           result.push({
  //             id_produit: produit.id_produit,
  //             nom_produit: produit.produit,
  //             stock_courant: original_stock_courant,
  //             total_achats,
  //             total_ventes,
  //             stock_calcule, // Conserver la valeur négative pour l'affichage
  //             difference,
  //             error,
  //           });
  //         }

  //         console.log(
  //           'Résultat de la vérification et correction des stocks :',
  //           JSON.stringify(result, null, 2),
  //         );
  //         return result;
  //       } catch (error) {
  //         console.error(
  //           'Erreur lors de la vérification et correction des stocks :',
  //           JSON.stringify(error, null, 2),
  //         );
  //         throw new BadRequestException(
  //           'Erreur lors de la vérification et correction des stocks',
  //         );
  //       }
  //     },
  //   );
  // }

  async checkStockAllProducts(): Promise<StockConsistency[]> {
    try {
      // Fetch all products, ordered alphabetically by produit
      const produits = await this.produitRepository
        .createQueryBuilder('produit')
        .select([
          'produit.id_produit AS id_produit',
          'produit.produit AS produit',
          'produit.stock_courant AS stock_courant',
        ])
        .orderBy('produit.produit', 'ASC')
        .getRawMany();

      // Fetch total achats and ventes for all products
      const achats = await this.lignesCommandeAchatRepository
        .createQueryBuilder('lca')
        .select('lca.designation', 'id_produit')
        .addSelect('SUM(lca.quantite)', 'total')
        .groupBy('lca.designation')
        .getRawMany();

      const ventes = await this.lignesCommandeVenteRepository
        .createQueryBuilder('lcv')
        .select('lcv.designation', 'id_produit')
        .addSelect('SUM(lcv.quantite)', 'total')
        .groupBy('lcv.designation')
        .getRawMany();

      // Map results to StockConsistency
      const result: StockConsistency[] = produits.map((produit) => {
        const totalAchats = achats.find(
          (a) => a.id_produit === produit.id_produit,
        );
        const totalVentes = ventes.find(
          (v) => v.id_produit === produit.id_produit,
        );

        const total_achats = Number(totalAchats?.total) || 0;
        const total_ventes = Number(totalVentes?.total) || 0;
        const stock_calcule = Math.max(total_achats - total_ventes, 0); // Convert negative stock to 0
        const difference = produit.stock_courant - stock_calcule;

        return {
          id_produit: produit.id_produit,
          nom_produit: produit.produit,
          stock_courant: produit.stock_courant,
          total_achats,
          total_ventes,
          stock_calcule,
          difference,
        };
      });

      console.log(
        'Résultat de la vérification des stocks:',
        JSON.stringify(result, null, 2),
      );
      return result;
    } catch (error) {
      console.error(
        'Erreur lors de la vérification des stocks:',
        JSON.stringify(error, null, 2),
      );
      throw new BadRequestException(
        'Erreur lors de la vérification des stocks',
      );
    }
  }

  // async checkStockAllProducts(): Promise<StockConsistency[]> {
  //   try {
  //     // Fetch all products
  //     const produits = await this.produitRepository.find();

  //     // Fetch total achats and ventes for all products
  //     const achats = await this.lignesCommandeAchatRepository
  //       .createQueryBuilder('lca')
  //       .select('lca.designation', 'id_produit')
  //       .addSelect('SUM(lca.quantite)', 'total')
  //       .groupBy('lca.designation')
  //       .orderBy('produit.produit', 'ASC')
  //       .getRawMany();

  //     const ventes = await this.lignesCommandeVenteRepository
  //       .createQueryBuilder('lcv')
  //       .select('lcv.designation', 'id_produit')
  //       .addSelect('SUM(lcv.quantite)', 'total')
  //       .groupBy('lcv.designation')
  //       .getRawMany();

  //     // Map results to StockConsistency
  //     const result: StockConsistency[] = produits.map((produit) => {
  //       const totalAchats = achats.find(
  //         (a) => a.id_produit === produit.id_produit,
  //       );
  //       const totalVentes = ventes.find(
  //         (v) => v.id_produit === produit.id_produit,
  //       );

  //       const total_achats = Number(totalAchats?.total) || 0;
  //       const total_ventes = Number(totalVentes?.total) || 0;
  //       const stock_calcule = total_achats - total_ventes;
  //       const difference = produit.stock_courant - stock_calcule;

  //       return {
  //         id_produit: produit.id_produit,
  //         nom_produit: produit.produit,
  //         stock_courant: produit.stock_courant,
  //         total_achats,
  //         total_ventes,
  //         stock_calcule,
  //         difference,
  //       };
  //     });

  //     console.log(
  //       'Résultat de la vérification des stocks:',
  //       JSON.stringify(result, null, 2),
  //     );
  //     return result;
  //   } catch (error) {
  //     console.error(
  //       'Erreur lors de la vérification des stocks:',
  //       JSON.stringify(error, null, 2),
  //     );
  //     throw new BadRequestException(
  //       'Erreur lors de la vérification des stocks',
  //     );
  //   }
  // }

  async exportStockToExcel(
    @Query('search') searchTerm: string,
    @Res() res: Response,
  ) {
    try {
      // Fetch all products with their unit prices
      const produits = await this.produitRepository
        .createQueryBuilder('produit')
        .select([
          'produit.id_produit AS id_produit',
          'produit.produit AS produit',
          'produit.prix_unitaire AS prix_unitaire',
          'produit.stock_courant AS stock_courant',
        ])
        .where('produit.produit != :timbre', { timbre: 'Timbre fiscale' })
        .orderBy('produit.produit', 'ASC')
        .getRawMany();

      // Fetch total achats and ventes for all products
      const achats = await this.lignesCommandeAchatRepository
        .createQueryBuilder('lca')
        .select('lca.designation', 'id_produit')
        .addSelect('SUM(lca.quantite)', 'total')
        .groupBy('lca.designation')
        .getRawMany();

      const ventes = await this.lignesCommandeVenteRepository
        .createQueryBuilder('lcv')
        .select('lcv.designation', 'id_produit')
        .addSelect('SUM(lcv.quantite)', 'total')
        .groupBy('lcv.designation')
        .getRawMany();

      // Map results to StockConsistency with value calculation
      const result: StockConsistency[] = produits.map((produit) => {
        const totalAchats = achats.find(
          (a) => a.id_produit === produit.id_produit,
        );
        const totalVentes = ventes.find(
          (v) => v.id_produit === produit.id_produit,
        );

        const total_achats = Number(totalAchats?.total) || 0;
        const total_ventes = Number(totalVentes?.total) || 0;
        const stock_calcule = Math.max(total_achats - total_ventes, 0); // Convert negative stock to 0
        const prix_unitaire = Number(produit.prix_unitaire) || 0;
        const valeur_stock = stock_calcule * prix_unitaire;

        return {
          id_produit: produit.id_produit,
          nom_produit: produit.produit,
          stock_courant: produit.stock_courant,
          total_achats,
          total_ventes,
          stock_calcule,
          difference: produit.stock_courant - stock_calcule,
          prix_unitaire,
          valeur_stock,
        };
      });

      // Calculate the total stock value
      const sommeTotaleValeur = result.reduce(
        (sum, p) => sum + (p.valeur_stock || 0),
        0,
      );

      // Prepare data for Excel, including the total sum row
      const dataForExcel = [
        ...result.map((p) => ({
          produit: p.nom_produit,
          prix_unitaire: p.prix_unitaire,
          stock_calcule: p.stock_calcule,
          valeur_stock: p.valeur_stock,
        })),
        { produit: '', prix_unitaire: '', stock_calcule: '', valeur_stock: '' }, // Empty row
        {
          produit: 'Somme totale',
          prix_unitaire: '',
          stock_calcule: '',
          valeur_stock: sommeTotaleValeur,
        },
      ];

      // Create a new worksheet
      const worksheet = XLSX.utils.json_to_sheet(dataForExcel, {
        header: ['produit', 'prix_unitaire', 'stock_calcule', 'valeur_stock'],
      });

      // Apply formatting to the total sum cell
      const totalRowIndex = result.length + 2; // +1 for header, +1 for empty row
      worksheet[`D${totalRowIndex + 1}`] = {
        v: sommeTotaleValeur,
        t: 'n', // Numeric type
        s: {
          font: { bold: true }, // Bold font
          alignment: { horizontal: 'right' },
        },
      };

      // Adjust column widths
      worksheet['!cols'] = [
        { wch: 30 }, // produit
        { wch: 15 }, // prix_unitaire
        { wch: 15 }, // stock_calcule
        { wch: 15 }, // valeur_stock
      ];

      // Create workbook and append worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'buffer',
      });

      // Set response headers
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="stock_inventaire.xlsx"',
      });

      // Send the buffer to the client
      res.send(excelBuffer);
    } catch (error) {
      console.error(
        "Erreur lors de l'exportation du stock en Excel:",
        JSON.stringify(error, null, 2),
      );
      throw new HttpException(
        "Erreur lors de l'exportation du stock en Excel",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // async checkStockAllProducts(): Promise<StockConsistency[]> {
  //   try {
  //     const produits = await this.produitRepository.find();

  //     const result: StockConsistency[] = [];
  //     for (const produit of produits) {
  //       const totalAchats = await this.lignesCommandeAchatRepository
  //         .createQueryBuilder('lca')
  //         .select('SUM(lca.quantite)', 'total')
  //         .where('lca.designation = :idProduit', {
  //           idProduit: produit.id_produit,
  //         })
  //         // .andWhere('lca.id_commande_achat != :idCommande', { idCommande: 60 })
  //         .getRawOne();

  //       const totalVentes = await this.lignesCommandeVenteRepository
  //         .createQueryBuilder('lcv')
  //         .select('SUM(lcv.quantite)', 'total')
  //         .where('lcv.designation = :idProduit', {
  //           idProduit: produit.id_produit,
  //         })
  //         .getRawOne();

  //       const total_achats = Number(totalAchats?.total) || 0;
  //       const total_ventes = Number(totalVentes?.total) || 0;
  //       const stock_calcule = total_achats - total_ventes;
  //       const difference = produit.stock_courant - stock_calcule;

  //       result.push({
  //         id_produit: produit.id_produit,
  //         nom_produit: produit.produit,
  //         stock_courant: produit.stock_courant,
  //         total_achats,
  //         total_ventes,
  //         stock_calcule,
  //         difference,
  //       });
  //     }

  //     console.log(
  //       'Résultat de la vérification des stocks:',
  //       JSON.stringify(result, null, 2),
  //     );
  //     return result;
  //   } catch (error) {
  //     console.error(
  //       'Erreur lors de la vérification des stocks:',
  //       JSON.stringify(error, null, 2),
  //     );
  //     throw new BadRequestException(
  //       'Erreur lors de la vérification des stocks',
  //     );
  //   }
  // }

  async listLignesVenteAcideFolique(): Promise<LignesCommandeVente[]> {
    return this.lignesCommandeVenteRepository.find({
      where: { designation: 18 },
      select: [
        'id_ligne_commande_vente',
        'id_commande_vente',
        'quantite',
        'date',
      ],
      order: { id_ligne_commande_vente: 'ASC' },
    });
  }

  async correctLigneVente(idLigne: number, quantiteCorrecte: number) {
    const ligne = await this.lignesCommandeVenteRepository.findOne({
      where: { id_ligne_commande_vente: idLigne },
    });
    if (!ligne) {
      throw new NotFoundException(`Ligne de vente ${idLigne} non trouvée`);
    }
    ligne.quantite = quantiteCorrecte;
    await this.lignesCommandeVenteRepository.save(ligne);
  }
}
