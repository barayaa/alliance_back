import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LignesDemandeAchat } from './lignes_demande_achat.entity';
import { CreateLignesDemandeAchatDto } from './dto/create-lignes_demande_achat.dto';
import { UpdateLignesDemandeAchatDto } from './dto/update-lignes_demande_achat.dto';

@Injectable()
export class LignesDemandeAchatService {
  constructor(
    @InjectRepository(LignesDemandeAchat)
    private lignes_demande_achatRepository: Repository<LignesDemandeAchat>,
  ) {}

  async findAll(): Promise<LignesDemandeAchat[]> {
    return this.lignes_demande_achatRepository.find();
  }

  async findOne(id: number): Promise<LignesDemandeAchat> {
    // const entity = await this.lignes_demande_achatRepository.findOne({ where: { id: id } });
    // if (!entity) throw new NotFoundException('LignesDemandeAchat not found');
    // return entity;

    return;
  }

  async create(dto: CreateLignesDemandeAchatDto): Promise<LignesDemandeAchat> {
    const entity = this.lignes_demande_achatRepository.create(dto);
    return this.lignes_demande_achatRepository.save(entity);
  }

  async update(
    id: number,
    dto: UpdateLignesDemandeAchatDto,
  ): Promise<LignesDemandeAchat> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.lignes_demande_achatRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.lignes_demande_achatRepository.remove(entity);
  }
}
