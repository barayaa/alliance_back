
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Statut } from './statut.entity';
import { CreateStatutDto } from './dto/create-statut.dto';
import { UpdateStatutDto } from './dto/update-statut.dto';

@Injectable()
export class StatutService {
  constructor(
    @InjectRepository(Statut)
    private statutRepository: Repository<Statut>,
  ) {}

  async findAll(): Promise<Statut[]> {
    return this.statutRepository.find();
  }

  async findOne(id: number): Promise<Statut> {
    const entity = await this.statutRepository.findOne({ where: { id_statut: id } });
    if (!entity) throw new NotFoundException('Statut not found');
    return entity;
  }

  async create(dto: CreateStatutDto): Promise<Statut> {
    const entity = this.statutRepository.create(dto);
    return this.statutRepository.save(entity);
  }

  async update(id: number, dto: UpdateStatutDto): Promise<Statut> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.statutRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.statutRepository.remove(entity);
  }
}
