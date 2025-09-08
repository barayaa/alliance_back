import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reclamation } from './reclamation.entity';
import { CreateReclamationDto } from './dto/create-reclamation.dto';
import { UpdateReclamationDto } from './dto/update-reclamation.dto';
import { Produit } from '../produit/produit.entity';
import { NatureReclamation } from '../nature_reclamation/nature_reclamation.entity';
import { AvoirService } from 'src/avoir/avoir.service';
import { CommandeVente } from 'src/commande_vente/commande_vente.entity';
import { CreateAvoirDto } from 'src/avoir/dto/create-avoir.dto';

// export interface CreateReclamationDto {
//   quantite: number;
//   prix_grossiste: number;
//   numero_facture: number;
//   date: string;
//   cle_produit: number;

//   cle_nature_reclamation: number;
// }

@Injectable()
export class ReclamationService {
  constructor(
    @InjectRepository(Reclamation)
    private reclamationRepository: Repository<Reclamation>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(NatureReclamation)
    private natureReclamationRepository: Repository<NatureReclamation>,

    @InjectRepository(CommandeVente)
    private commandeVenteRepository: Repository<CommandeVente>,

    private avoirService: AvoirService,
  ) {}

  async findAll(): Promise<Reclamation[]> {
    console.log('findAll called');
    try {
      const reclamations = await this.reclamationRepository
        .createQueryBuilder('r')
        .leftJoinAndSelect('r.produit', 'produit')
        .leftJoinAndSelect('r.nature_reclamation', 'nature_reclamation')
        .getMany();
      console.log('Reclamations data:', JSON.stringify(reclamations, null, 2));
      return reclamations;
    } catch (error) {
      console.error('findAll query failed:', JSON.stringify(error, null, 2));
      throw new BadRequestException(
        `Failed to execute findAll query: ${error.message}`,
      );
    }
  }

  async create(dto: CreateReclamationDto): Promise<Reclamation> {
    return this.reclamationRepository.manager.transaction(async (manager) => {
      try {
        // Vérifier le produit
        const produit = await manager.findOne(Produit, {
          where: { id_produit: dto.cle_produit },
        });
        if (!produit) {
          throw new NotFoundException(
            `Produit avec ID ${dto.cle_produit} non trouvé`,
          );
        }

        // Vérifier la nature de réclamation
        const natureReclamation = await manager.findOne(NatureReclamation, {
          where: { id_nature_reclamation: dto.cle_nature_reclamation },
        });
        if (!natureReclamation) {
          throw new NotFoundException(
            `Nature de réclamation avec ID ${dto.cle_nature_reclamation} non trouvée`,
          );
        }

        // Créer la réclamation
        const reclamation = manager.create(Reclamation, {
          ...dto,
          date: new Date(dto.date),
          produit,
          nature_reclamation: natureReclamation,
        });
        const savedReclamation = await manager.save(Reclamation, reclamation);
        console.log(
          'Reclamation créée:',
          JSON.stringify(savedReclamation, null, 2),
        );

        // Si nature_reclamation est "Retour bon état" (id: 2), créer une facture d'avoir
        if (dto.cle_nature_reclamation === 2) {
          // Trouver la facture de vente associée
          const factureVente = await manager.findOne(CommandeVente, {
            where: {
              id_commande_vente: dto.numero_facture,
              type_facture: 'FV',
            },
            relations: ['client', 'lignes', 'lignes.produit'],
          });
          if (!factureVente) {
            throw new NotFoundException(
              `Facture de vente avec numéro ${dto.numero_facture} non trouvée`,
            );
          }

          // Vérifier que le produit est dans la facture
          const ligneFacture = factureVente.lignes.find(
            (ligne) => ligne.designation === dto.cle_produit,
          );
          if (!ligneFacture) {
            throw new BadRequestException(
              `Produit ${dto.cle_produit} non trouvé dans la facture ${dto.numero_facture}`,
            );
          }

          // Vérifier que la quantité demandée ne dépasse pas la quantité dans la facture
          if (dto.quantite > ligneFacture.quantite) {
            throw new BadRequestException(
              `Quantité ${dto.quantite} dépasse la quantité de la facture (${ligneFacture.quantite})`,
            );
          }

          // Créer le DTO pour l'avoir
          const avoirDto: CreateAvoirDto = {
            id_facture_vente: factureVente.id_commande_vente,
            id_client: factureVente.id_client,
            login: 'system', // À remplacer par l'utilisateur connecté si disponible
            date_avoir: new Date(dto.date),
            remise: 0,
            type_isb: 'A', // Par défaut, ajuster selon les besoins
            type_reglement: 'ESPECES', // Par défaut, ajuster selon les besoins
            commentaire1: `Avoir automatique pour réclamation ${savedReclamation.id_reclamation} (Retour bon état)`,
            lignes: [
              {
                id_produit: dto.cle_produit,
                quantite: dto.quantite,
                remise: 0,
                description_remise: 'Retour bon état',
                isb_ligne: 0,
              },
            ],
          };

          // Créer l'avoir
          const avoir = await this.avoirService.createAvoir(avoirDto);
          console.log(
            'Avoir créé pour réclamation:',
            JSON.stringify(avoir, null, 2),
          );
        }

        return savedReclamation;
      } catch (error) {
        console.error('Create failed:', JSON.stringify(error, null, 2));
        throw new BadRequestException(
          `Failed to create reclamation: ${error.message}`,
        );
      }
    });
  }

  // async create(dto: CreateReclamationDto): Promise<Reclamation> {
  //   try {
  //     const produit = await this.produitRepository.findOne({
  //       where: { id_produit: dto.cle_produit },
  //     });
  //     if (!produit) {
  //       throw new NotFoundException(
  //         `Produit avec ID ${dto.cle_produit} non trouvé`,
  //       );
  //     }
  //     const natureReclamation = await this.natureReclamationRepository.findOne({
  //       where: { id_nature_reclamation: dto.cle_nature_reclamation },
  //     });
  //     if (!natureReclamation) {
  //       throw new NotFoundException(
  //         `Nature de réclamation avec ID ${dto.cle_nature_reclamation} non trouvée`,
  //       );
  //     }
  //     const reclamation = this.reclamationRepository.create({
  //       ...dto,
  //       date: new Date(dto.date),
  //       produit,
  //       nature_reclamation: natureReclamation,
  //     });
  //     const savedReclamation =
  //       await this.reclamationRepository.save(reclamation);
  //     console.log(
  //       'Reclamation créée:',
  //       JSON.stringify(savedReclamation, null, 2),
  //     );
  //     return savedReclamation;
  //   } catch (error) {
  //     console.error('Create failed:', JSON.stringify(error, null, 2));
  //     throw new BadRequestException(
  //       `Failed to create reclamation: ${error.message}`,
  //     );
  //   }
  // }

  async findNatureReclamations(): Promise<NatureReclamation[]> {
    try {
      const natures = await this.natureReclamationRepository.find();
      console.log('Natures de réclamation:', JSON.stringify(natures, null, 2));
      return natures;
    } catch (error) {
      console.error(
        'findNatureReclamations failed:',
        JSON.stringify(error, null, 2),
      );
      throw new BadRequestException(
        `Failed to fetch nature reclamations: ${error.message}`,
      );
    }
  }

  async findOne(id: number): Promise<Reclamation> {
    const entity = await this.reclamationRepository.findOne({
      where: { id_reclamation: id },
      relations: ['produit', 'nature_reclamation'],
    });
    if (!entity) throw new NotFoundException('Reclamation not found');
    return entity;
  }

  async update(id: number, dto: UpdateReclamationDto): Promise<Reclamation> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.reclamationRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.reclamationRepository.remove(entity);
  }
}
