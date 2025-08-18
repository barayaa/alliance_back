
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marque } from './marque.entity';
import { CreateMarqueDto } from './dto/create-marque.dto';
import { UpdateMarqueDto } from './dto/update-marque.dto';

@Injectable()
export class MarqueService {
  constructor(
    @InjectRepository(Marque)
    private marqueRepository: Repository<Marque>,
  ) {}

  async findAll(): Promise<Marque[]> {
    return this.marqueRepository.find();
  }

  async findOne(id: number): Promise<Marque> {
    const entity = await this.marqueRepository.findOne({ where: { id_marque: id } });
    if (!entity) throw new NotFoundException('Marque not found');
    return entity;
  }

  async create(dto: CreateMarqueDto): Promise<Marque> {
    const entity = this.marqueRepository.create(dto);
    return this.marqueRepository.save(entity);
  }

  async update(id: number, dto: UpdateMarqueDto): Promise<Marque> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.marqueRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.marqueRepository.remove(entity);
  }
}
