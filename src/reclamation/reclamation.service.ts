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
    try {
      const produit = await this.produitRepository.findOne({
        where: { id_produit: dto.cle_produit },
      });
      if (!produit) {
        throw new NotFoundException(
          `Produit avec ID ${dto.cle_produit} non trouvé`,
        );
      }
      const natureReclamation = await this.natureReclamationRepository.findOne({
        where: { id_nature_reclamation: dto.cle_nature_reclamation },
      });
      if (!natureReclamation) {
        throw new NotFoundException(
          `Nature de réclamation avec ID ${dto.cle_nature_reclamation} non trouvée`,
        );
      }
      const reclamation = this.reclamationRepository.create({
        ...dto,
        date: new Date(dto.date),
        produit,
        nature_reclamation: natureReclamation,
      });
      const savedReclamation =
        await this.reclamationRepository.save(reclamation);
      console.log(
        'Reclamation créée:',
        JSON.stringify(savedReclamation, null, 2),
      );
      return savedReclamation;
    } catch (error) {
      console.error('Create failed:', JSON.stringify(error, null, 2));
      throw new BadRequestException(
        `Failed to create reclamation: ${error.message}`,
      );
    }
  }

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

  // async findAll(): Promise<Reclamation[]> {
  //   return this.reclamationRepository.find();
  // }

  async findOne(id: number): Promise<Reclamation> {
    const entity = await this.reclamationRepository.findOne({
      where: { id_reclamation: id },
    });
    if (!entity) throw new NotFoundException('Reclamation not found');
    return entity;
  }

  // async create(dto: CreateReclamationDto): Promise<Reclamation> {
  //   return;
  //   // const entity = this.reclamationRepository.create(dto);
  //   // return this.reclamationRepository.save(entity);
  // }

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
