
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemandeAchat } from './demande_achat.entity';
import { CreateDemandeAchatDto } from './dto/create-demande_achat.dto';
import { UpdateDemandeAchatDto } from './dto/update-demande_achat.dto';

@Injectable()
export class DemandeAchatService {
  constructor(
    @InjectRepository(DemandeAchat)
    private demande_achatRepository: Repository<DemandeAchat>,
  ) {}

  async findAll(): Promise<DemandeAchat[]> {
    return this.demande_achatRepository.find();
  }

  async findOne(id: number): Promise<DemandeAchat> {
    const entity = await this.demande_achatRepository.findOne({ where: { id_demande_achat: id } });
    if (!entity) throw new NotFoundException('DemandeAchat not found');
    return entity;
  }

  async create(dto: CreateDemandeAchatDto): Promise<DemandeAchat> {
    const entity = this.demande_achatRepository.create(dto);
    return this.demande_achatRepository.save(entity);
  }

  async update(id: number, dto: UpdateDemandeAchatDto): Promise<DemandeAchat> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.demande_achatRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.demande_achatRepository.remove(entity);
  }
}
