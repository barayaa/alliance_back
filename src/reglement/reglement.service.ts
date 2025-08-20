import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ): Promise<PaymentDistributionResult> {
    const {
      id_client,
      montant,
      date,
      id_commande_vente,
      id_type_reglement,
      id_caisse,
      id_compte,
    } = createReglementDto;

    if (
      !id_client ||
      montant <= 0 ||
      !date ||
      !id_commande_vente ||
      !id_type_reglement
    ) {
      throw new BadRequestException(
        'id_client, montant positif, date, id_commande_vente et id_type_reglement sont requis',
      );
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

    const client = await this.clientRepository.findOne({
      where: { id_client },
    });
    if (!client) {
      throw new NotFoundException(`Client avec l'ID ${id_client} non trouvé`);
    }

    // Convertir id_commande_vente en number si nécessaire
    const idCommandeVenteNumber = parseInt(id_commande_vente, 10);
    if (isNaN(idCommandeVenteNumber)) {
      throw new BadRequestException(
        `id_commande_vente doit être un nombre valide`,
      );
    }

    const facture = await this.commandeVenteRepository.findOne({
      where: { id_commande_vente: idCommandeVenteNumber, reglee: 0 },
    });
    if (!facture) {
      throw new NotFoundException(
        `Facture avec l'ID ${id_commande_vente} non trouvée ou déjà réglée`,
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

    const montantDu = facture.montant_total - (facture.montant_paye || 0);
    if (montantDu <= 0) {
      throw new BadRequestException(
        `La facture ${id_commande_vente} est déjà réglée`,
      );
    }

    const montantAffecte = Math.min(montant, montantDu);
    let montantRestant = montant - montantAffecte;

    facture.montant_paye = (facture.montant_paye || 0) + montantAffecte;
    facture.reglee = facture.montant_paye >= facture.montant_total ? 1 : 0;

    const reglement = new Reglement();
    reglement.id_client = id_client;
    reglement.client = client;
    reglement.montant = montantAffecte;
    reglement.date = date;
    reglement.id_commande_vente = id_commande_vente; // Garder en string pour Reglement
    reglement.commandeVente = facture;
    reglement.id_type_reglement = id_type_reglement;
    reglement.typeReglement = typeReglement;
    reglement.id_caisse = id_caisse || null;
    reglement.caisse = caisse || null;
    reglement.id_compte = id_compte || null;
    reglement.compte = compte || null;

    if (typeReglement.type_reglement === 'E' && caisse) {
      caisse.solde += montantAffecte;
      await this.caisseRepository.save(caisse);
    } else if (['D', 'V'].includes(typeReglement.type_reglement) && compte) {
      compte.solde += montantAffecte;
      await this.compteRepository.save(compte);
    }

    if (montantRestant > 0) {
      client.avance = (client.avance || 0) + montantRestant;
      await this.clientRepository.save(client);
    }

    try {
      await this.commandeVenteRepository.save(facture);
      await this.reglementRepository.save(reglement);
      console.log('Règlement créé:', JSON.stringify(reglement, null, 2));
      return {
        facturesAffectees: [
          {
            id_commande_vente: id_commande_vente,
            montant_total: facture.montant_total,
            montant_paye_avant: (facture.montant_paye || 0) - montantAffecte,
            montant_paye_actuel: montantAffecte,
            montant_restant: facture.montant_total - facture.montant_paye,
            reglee: facture.reglee === 1, // Conversion number -> boolean
          },
        ],
        avance: client.avance,
        montantRestant,
      };
    } catch (error) {
      console.error('Erreur lors de la création du règlement:', error);
      throw new BadRequestException('Erreur lors de la création du règlement');
    }
  }

  // async createReglement(
  //   createReglementDto: CreateReglementDto,
  // ): Promise<PaymentDistributionResult> {
  //   const { id_client, montant, date } = createReglementDto;

  //   if (!id_client || montant <= 0 || !date) {
  //     throw new BadRequestException(
  //       'id_client, montant positif et date sont requis',
  //     );
  //   }

  //   const client = await this.clientRepository.findOne({
  //     where: { id_client },
  //   });
  //   if (!client) {
  //     throw new NotFoundException(`Client avec l'ID ${id_client} non trouvé`);
  //   }

  //   const factures = await this.commandeVenteRepository.find({
  //     where: {
  //       id_client,
  //       reglee: 0,
  //     },
  //     order: { date_commande_vente: 'ASC' },
  //   });

  //   let montantRestant = montant;
  //   const facturesAffectees: PaymentDistributionResult['facturesAffectees'] =
  //     [];
  //   const reglementsToSave: Reglement[] = [];

  //   for (const facture of factures) {
  //     if (montantRestant <= 0) break;

  //     const montantDu = facture.montant_total - (facture.montant_paye || 0);
  //     if (montantDu <= 0) continue;

  //     const montantAffecte = Math.min(montantRestant, montantDu);
  //     montantRestant -= montantAffecte;

  //     facture.montant_paye = (facture.montant_paye || 0) + montantAffecte;
  //     facture.reglee = facture.montant_paye >= facture.montant_total ? 1 : 0;

  //     const reglement = new Reglement();
  //     reglement.id_client = id_client;
  //     reglement.client = client;
  //     reglement.montant = montantAffecte;
  //     reglement.date = date;
  //     reglement.id_commande_vente = facture.id_commande_vente.toString();
  //     reglement.commandeVente = facture;
  //     reglementsToSave.push(reglement);

  //     facturesAffectees.push({
  //       id_commande_vente: facture.id_commande_vente.toString(),
  //       montant_total: facture.montant_total,
  //       montant_paye_avant: (facture.montant_paye || 0) - montantAffecte,
  //       montant_paye_actuel: montantAffecte,
  //       montant_restant: facture.montant_total - facture.montant_paye,
  //       reglee: facture.montant_paye >= facture.montant_total,
  //     });
  //   }

  //   if (montantRestant > 0) {
  //     client.avance = (client.avance || 0) + montantRestant;
  //     await this.clientRepository.save(client);
  //   }

  //   try {
  //     await this.commandeVenteRepository.save(factures);
  //     await this.reglementRepository.save(reglementsToSave);
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
  //     console.error('Erreur lors de la création des règlements:', error);
  //     throw new BadRequestException(
  //       'Erreur lors de la création des règlements',
  //     );
  //   }
  // }
}
