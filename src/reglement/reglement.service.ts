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

  // async findHistoriqueByClient(
  //   id_client: number,
  //   dateDebut?: string,
  //   dateFin?: string,
  // ): Promise<any> {
  //   try {
  //     // Récupérer le client avec son avance
  //     const client = await this.clientRepository.findOne({
  //       where: { id_client },
  //     });
  //     if (!client)
  //       throw new NotFoundException(`Client avec l'ID ${id_client} non trouvé`);

  //     // Valider le format des dates
  //     if (dateDebut && !/^\d{4}-\d{2}-\d{2}$/.test(dateDebut)) {
  //       throw new BadRequestException(
  //         'Format de dateDebut invalide (YYYY-MM-DD attendu)',
  //       );
  //     }
  //     if (dateFin && !/^\d{4}-\d{2}-\d{2}$/.test(dateFin)) {
  //       throw new BadRequestException(
  //         'Format de dateFin invalide (YYYY-MM-DD attendu)',
  //       );
  //     }

  //     // Récupérer les commandes du client
  //     const commandes = await this.commandeVenteRepository.find({
  //       where: { id_client },
  //       relations: ['client', 'reglements'],
  //       order: { date_commande_vente: 'DESC' },
  //     });

  //     // Initialiser l'avance disponible
  //     let remainingAdvance = client.avance || 0;

  //     // Filtrer les règlements par plage de dates et appliquer l'avance
  //     const historique = commandes
  //       .map((commande) => {
  //         // Filtrer les règlements selon la plage de dates
  //         const filteredReglements = (commande.reglements || []).filter(
  //           (reglement) => {
  //             if (!dateDebut && !dateFin) return true; // Pas de filtre de date
  //             if (dateDebut && !dateFin) return reglement.date >= dateDebut;
  //             if (!dateDebut && dateFin) return reglement.date <= dateFin;
  //             return reglement.date >= dateDebut && reglement.date <= dateFin;
  //           },
  //         );

  //         // Calculer les montants initiaux
  //         let montantPaye = filteredReglements.reduce(
  //           (sum, reg) => sum + (reg.montant || 0),
  //           0,
  //         );
  //         let montantRestant = commande.montant_total - montantPaye;

  //         // Appliquer l'avance si montant restant > 0 et avance disponible
  //         let avanceApplied = 0;
  //         if (montantRestant > 0 && remainingAdvance > 0) {
  //           avanceApplied = Math.min(montantRestant, remainingAdvance);
  //           montantPaye += avanceApplied;
  //           montantRestant -= avanceApplied;
  //           remainingAdvance -= avanceApplied;
  //         }

  //         // Considérer la facture comme réglée si le solde restant est inférieur à 10
  //         const isReglee = Math.abs(montantRestant) <= 10 ? 1 : 0;

  //         // Ne retourner que les commandes avec des règlements ou dans la plage de dates
  //         if (
  //           filteredReglements.length === 0 &&
  //           (dateDebut || dateFin) &&
  //           avanceApplied === 0
  //         ) {
  //           return null;
  //         }

  //         // Ajouter un règlement virtuel pour l'avance appliquée
  //         const reglements = [...filteredReglements];
  //         // if (avanceApplied > 0) {
  //         //   reglements.push({
  //         //     id_reglement: `avance-${commande.id_commande_vente}`,
  //         //     montant: parseFloat(avanceApplied.toFixed(2)),
  //         //     date: new Date().toISOString().split('T')[0],
  //         //   });
  //         // }

  //         if (avanceApplied > 0) {
  //           reglements.push({
  //             // Pas d'id_reglement pour les règlements virtuels
  //             montant: parseFloat(avanceApplied.toFixed(2)),
  //             date: new Date().toISOString().split('T')[0],
  //             id_client: 0,
  //             client: new Client(),
  //             id_reglement: 0,
  //             id_commande_vente: '',
  //             commandeVente: new CommandeVente(),
  //             id_type_reglement: 0,
  //             typeReglement: new TypeReglement(),
  //           });
  //         }

  //         return {
  //           facture: {
  //             id_commande_vente: commande.id_commande_vente,
  //             numero_facture_certifiee: commande.numero_facture_certifiee,
  //             numero_seq: commande.numero_seq,
  //             date_commande_vente: commande.date_commande_vente,
  //             montant_total: parseFloat(commande.montant_total.toFixed(2)),
  //             montant_paye: parseFloat(montantPaye.toFixed(2)),
  //             montant_restant: parseFloat(montantRestant.toFixed(2)),
  //             reglee: isReglee,
  //             type_reglement: commande.type_reglement,
  //           },
  //           reglements: reglements.map((reglement) => ({
  //             id_reglement: reglement.id_reglement,
  //             montant: parseFloat((reglement.montant || 0).toFixed(2)),
  //             date: reglement.date,
  //           })),
  //         };
  //       })
  //       .filter((item) => item !== null); // Supprimer les commandes sans règlements correspondants

  //     console.log(
  //       `Historique du client ${id_client} (avance restante: ${remainingAdvance}):`,
  //       JSON.stringify(historique, null, 2),
  //     );

  //     return historique;
  //   } catch (error) {
  //     console.error(
  //       `Erreur lors de la récupération de l'historique du client ${id_client}:`,
  //       error,
  //     );
  //     throw error instanceof NotFoundException ||
  //       error instanceof BadRequestException
  //       ? error
  //       : new BadRequestException(
  //           "Erreur lors de la récupération de l'historique des règlements",
  //         );
  //   }
  // }

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
  //   const factures = await this.commandeVenteRepository.find({
  //     where: { id_client, reglee: 0 },
  //     order: { date_commande_vente: 'ASC' },
  //   });

  //   let montantRestant = montant;
  //   const facturesAffectees: PaymentDistributionResult['facturesAffectees'] =
  //     [];
  //   const reglementsToSave: Reglement[] = [];

  //   // Répartir le montant sur les factures
  //   for (const facture of factures) {
  //     if (montantRestant <= 0) break;

  //     const montantDu = facture.montant_total - (facture.montant_paye || 0);
  //     if (montantDu <= 0) continue;

  //     const montantAffecte = Math.min(montantRestant, montantDu);
  //     montantRestant -= montantAffecte;

  //     // Mettre à jour la facture
  //     facture.montant_paye = (facture.montant_paye || 0) + montantAffecte;
  //     facture.montant_restant = facture.montant_total - facture.montant_paye;
  //     facture.reglee = facture.montant_paye >= facture.montant_total ? 1 : 0;

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
  //   }

  //   // Stocker le surplus comme avance
  //   if (montantRestant > 0) {
  //     client.avance = (client.avance || 0) + montantRestant;
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

  async createReglement(
    createReglementDto: CreateReglementDto,
  ): Promise<PaymentDistributionResult> {
    const {
      id_client,
      montant,
      date,
      id_type_reglement,
      id_caisse,
      id_compte,
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

    // Récupérer les factures non réglées ou partiellement réglées du client
    const factures = await this.commandeVenteRepository
      .createQueryBuilder('commande')
      .where('commande.id_client = :id_client', { id_client })
      .andWhere('(commande.reglee = 0 OR commande.montant_restant > 0)')
      .orderBy('commande.date_commande_vente', 'ASC')
      .getMany();

    console.log(
      `Factures récupérées pour le client ${id_client}: ${factures.length}`,
    );

    let montantRestant = montant;
    const facturesAffectees: PaymentDistributionResult['facturesAffectees'] =
      [];
    const reglementsToSave: Reglement[] = [];

    // Répartir le montant sur les factures
    let montantAppliqueAuxFactures = 0;
    for (const facture of factures) {
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

      // Mettre à jour la facture
      facture.montant_paye = (facture.montant_paye || 0) + montantAffecte;
      facture.montant_restant = facture.montant_total - facture.montant_paye;
      facture.reglee = facture.montant_restant <= 0 ? 1 : 0;

      // Créer un règlement
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

      // Ajouter au récapitulatif
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

    // Mettre à jour le solde du client
    client.solde = (client.solde || 0) - montantAppliqueAuxFactures;
    if (client.solde < 0) {
      client.solde = 0; // Éviter un solde négatif
    }

    // Stocker le surplus comme avance
    if (montantRestant > 0) {
      client.avance = (client.avance || 0) + montantRestant;
      console.log(
        `Avance mise à jour pour le client ${id_client}: ${client.avance}`,
      );
    }

    // Mettre à jour le solde de la caisse ou du compte
    if (caisse) {
      caisse.solde = (caisse.solde || 0) + montant;
    }
    if (compte) {
      compte.solde = (compte.solde || 0) + montant;
    }

    // Sauvegarder toutes les modifications dans une transaction
    try {
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        if (caisse) {
          await transactionalEntityManager.save(Caisse, caisse);
        }
        if (compte) {
          await transactionalEntityManager.save(Compte, compte);
        }
        await transactionalEntityManager.save(Client, client);
        await transactionalEntityManager.save(CommandeVente, factures);
        await transactionalEntityManager.save(Reglement, reglementsToSave);
      });

      // Logs pour le débogage
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
      };
    } catch (error) {
      console.error('Erreur lors de la création du règlement:', error);
      throw new BadRequestException('Erreur lors de la création du règlement');
    }
  }
}
