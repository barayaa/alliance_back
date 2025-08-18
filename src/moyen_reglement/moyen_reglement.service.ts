import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoyenReglement } from './moyen_reglement.entity';
import { CreateMoyenReglementDto } from './dto/create-moyen_reglement.dto';
import { UpdateMoyenReglementDto } from './dto/update-moyen_reglement.dto';

@Injectable()
export class MoyenReglementService {
  constructor(
    @InjectRepository(MoyenReglement)
    private moyen_reglementRepository: Repository<MoyenReglement>,
  ) {}

  async findAll(): Promise<MoyenReglement[]> {
    return this.moyen_reglementRepository.find();
  }

  async findOne(id: number): Promise<MoyenReglement> {
    // const entity = await this.moyen_reglementRepository.findOne({ where: { id_moyen_reglement: id } });
    // if (!entity) throw new NotFoundException('MoyenReglement not found');
    // return entity;

    return;
  }

  async create(dto: CreateMoyenReglementDto): Promise<MoyenReglement> {
    const entity = this.moyen_reglementRepository.create(dto);
    return this.moyen_reglementRepository.save(entity);
  }

  async update(
    id: number,
    dto: UpdateMoyenReglementDto,
  ): Promise<MoyenReglement> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.moyen_reglementRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.moyen_reglementRepository.remove(entity);
  }
}
