import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
  Inject,
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
      where.date_commande_achat = Between(startDate, endDate);
    }
    if (reference) {
      where.reference = Like(`%${reference}%`);
    }
    try {
      const commandes = await this.commande_achatRepository.find({
        where,
        relations: ['titulaire_amm', 'destination', 'lignes'],
      });
      console.log('Commandes trouvées:', JSON.stringify(commandes, null, 2));
      return commandes;
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des commandes:',
        JSON.stringify(error, null, 2),
      );
      throw new BadRequestException(
        "Erreur lors de la récupération des commandes d'achat",
      );
    }
  }

  async findOne(id: number): Promise<CommandeAchat> {
    const entity = await this.commande_achatRepository.findOne({
      where: { id_commande_achat: id },
      relations: ['lignes', 'lignes.produit', 'titulaire_amm', 'destination'],
    });
    if (!entity) {
      throw new NotFoundException(`CommandeAchat avec l'ID ${id} non trouvée`);
    }
    return entity;
  }

  async create(
    dto: CreateCommandeAchatDto,
    user: User,
  ): Promise<CommandeAchat> {
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    return await this.commande_achatRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const fournisseur = await transactionalEntityManager.findOne(
          TitulaireAmm,
          {
            where: { id_titulaire_amm: dto.id_fournisseur },
          },
        );
        if (!fournisseur) {
          throw new NotFoundException(
            `Fournisseur avec l'ID ${dto.id_fournisseur} non trouvé`,
          );
        }
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
        const commande = transactionalEntityManager.create(CommandeAchat, {
          date_commande_achat: new Date(dto.date_commande_achat),
          montant_total: montantTotal,
          montant_paye: dto.montant_paye || 0,
          montant_restant: montantTotal - (dto.montant_paye || 0),
          validee: dto.validee || 1,
          statut: dto.statut || 0,
          id_fournisseur: dto.id_fournisseur,
          reglee: dto.reglee || 0,
          moyen_reglement: dto.moyen_reglement || 0,
          type_reglement: dto.type_reglement || 0,
          tva: dto.tva || 0,
          avoir: dto.avoir || 0,
          reference: dto.reference,
          user: user.nom,
          id_destination: dto.id_destination,
          titulaire_amm: fournisseur,
          destination,
        });
        const savedCommande = await transactionalEntityManager.save(
          CommandeAchat,
          commande,
        );
        for (const produit of dto.produits) {
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
      const produits = await this.produitRepository.find();

      const result: StockConsistency[] = [];
      for (const produit of produits) {
        const totalAchats = await this.lignesCommandeAchatRepository
          .createQueryBuilder('lca')
          .select('SUM(lca.quantite)', 'total')
          .where('lca.designation = :idProduit', {
            idProduit: produit.id_produit,
          })
          // .andWhere('lca.id_commande_achat != :idCommande', { idCommande: 60 })
          .getRawOne();

        const totalVentes = await this.lignesCommandeVenteRepository
          .createQueryBuilder('lcv')
          .select('SUM(lcv.quantite)', 'total')
          .where('lcv.designation = :idProduit', {
            idProduit: produit.id_produit,
          })
          .getRawOne();

        const total_achats = Number(totalAchats?.total) || 0;
        const total_ventes = Number(totalVentes?.total) || 0;
        const stock_calcule = total_achats - total_ventes;
        const difference = produit.stock_courant - stock_calcule;

        result.push({
          id_produit: produit.id_produit,
          nom_produit: produit.produit,
          stock_courant: produit.stock_courant,
          total_achats,
          total_ventes,
          stock_calcule,
          difference,
        });
      }

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
