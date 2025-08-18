
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoieAdministration } from './voie_administration.entity';
import { CreateVoieAdministrationDto } from './dto/create-voie_administration.dto';
import { UpdateVoieAdministrationDto } from './dto/update-voie_administration.dto';

@Injectable()
export class VoieAdministrationService {
  constructor(
    @InjectRepository(VoieAdministration)
    private voie_administrationRepository: Repository<VoieAdministration>,
  ) {}

  async findAll(): Promise<VoieAdministration[]> {
    return this.voie_administrationRepository.find();
  }

  async findOne(id: number): Promise<VoieAdministration> {
    const entity = await this.voie_administrationRepository.findOne({ where: { id_voie_administration: id } });
    if (!entity) throw new NotFoundException('VoieAdministration not found');
    return entity;
  }

  async create(dto: CreateVoieAdministrationDto): Promise<VoieAdministration> {
    const entity = this.voie_administrationRepository.create(dto);
    return this.voie_administrationRepository.save(entity);
  }

  async update(id: number, dto: UpdateVoieAdministrationDto): Promise<VoieAdministration> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.voie_administrationRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.voie_administrationRepository.remove(entity);
  }
}
