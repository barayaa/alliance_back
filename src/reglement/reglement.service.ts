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

@Injectable()
export class ReglementService {
  constructor(
    @InjectRepository(Reglement)
    private reglementRepository: Repository<Reglement>,

    @InjectRepository(CommandeVente)
    private commandeVenteRepository: Repository<CommandeVente>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
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

  createReglement() {}
}
