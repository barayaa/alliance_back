
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conformite } from './conformite.entity';
import { CreateConformiteDto } from './dto/create-conformite.dto';
import { UpdateConformiteDto } from './dto/update-conformite.dto';

@Injectable()
export class ConformiteService {
  constructor(
    @InjectRepository(Conformite)
    private conformiteRepository: Repository<Conformite>,
  ) {}

  async findAll(): Promise<Conformite[]> {
    return this.conformiteRepository.find();
  }

  async findOne(id: number): Promise<Conformite> {
    const entity = await this.conformiteRepository.findOne({ where: { id_conformite: id } });
    if (!entity) throw new NotFoundException('Conformite not found');
    return entity;
  }

  async create(dto: CreateConformiteDto): Promise<Conformite> {
    const entity = this.conformiteRepository.create(dto);
    return this.conformiteRepository.save(entity);
  }

  async update(id: number, dto: UpdateConformiteDto): Promise<Conformite> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.conformiteRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.conformiteRepository.remove(entity);
  }
}
