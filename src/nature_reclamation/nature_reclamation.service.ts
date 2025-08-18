
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NatureReclamation } from './nature_reclamation.entity';
import { CreateNatureReclamationDto } from './dto/create-nature_reclamation.dto';
import { UpdateNatureReclamationDto } from './dto/update-nature_reclamation.dto';

@Injectable()
export class NatureReclamationService {
  constructor(
    @InjectRepository(NatureReclamation)
    private nature_reclamationRepository: Repository<NatureReclamation>,
  ) {}

  async findAll(): Promise<NatureReclamation[]> {
    return this.nature_reclamationRepository.find();
  }

  async findOne(id: number): Promise<NatureReclamation> {
    const entity = await this.nature_reclamationRepository.findOne({ where: { id_nature_reclamation: id } });
    if (!entity) throw new NotFoundException('NatureReclamation not found');
    return entity;
  }

  async create(dto: CreateNatureReclamationDto): Promise<NatureReclamation> {
    const entity = this.nature_reclamationRepository.create(dto);
    return this.nature_reclamationRepository.save(entity);
  }

  async update(id: number, dto: UpdateNatureReclamationDto): Promise<NatureReclamation> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.nature_reclamationRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.nature_reclamationRepository.remove(entity);
  }
}
