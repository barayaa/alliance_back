import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LignesProformat } from './lignes_proformat.entity';
import { CreateLignesProformatDto } from './dto/create-lignes_proformat.dto';
import { UpdateLignesProformatDto } from './dto/update-lignes_proformat.dto';

@Injectable()
export class LignesProformatService {
  constructor(
    @InjectRepository(LignesProformat)
    private lignes_proformatRepository: Repository<LignesProformat>,
  ) {}

  async findAll(): Promise<LignesProformat[]> {
    return this.lignes_proformatRepository.find();
  }

  async findOne(id: number): Promise<LignesProformat> {
    // const entity = await this.lignes_proformatRepository.findOne({ where: { id_lignes_proformat: id } });
    // if (!entity) throw new NotFoundException('LignesProformat not found');
    // return entity;

    return;
  }

  async create(dto: CreateLignesProformatDto): Promise<LignesProformat> {
    return;
    // const entity = this.lignes_proformatRepository.create(dto);
    // return this.lignes_proformatRepository.save(entity);
    // const entity = this.lignes_proformatRepository.create(dto);
    // return this.lignes_proformatRepository.save(entity);
  }

  async update(
    id: number,
    dto: UpdateLignesProformatDto,
  ): Promise<LignesProformat> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.lignes_proformatRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.lignes_proformatRepository.remove(entity);
  }
}
