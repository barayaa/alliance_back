
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Forme } from './forme.entity';
import { CreateFormeDto } from './dto/create-forme.dto';
import { UpdateFormeDto } from './dto/update-forme.dto';

@Injectable()
export class FormeService {
  constructor(
    @InjectRepository(Forme)
    private formeRepository: Repository<Forme>,
  ) {}

  async findAll(): Promise<Forme[]> {
    return this.formeRepository.find();
  }

  async findOne(id: number): Promise<Forme> {
    const entity = await this.formeRepository.findOne({ where: { id_forme: id } });
    if (!entity) throw new NotFoundException('Forme not found');
    return entity;
  }

  async create(dto: CreateFormeDto): Promise<Forme> {
    const entity = this.formeRepository.create(dto);
    return this.formeRepository.save(entity);
  }

  async update(id: number, dto: UpdateFormeDto): Promise<Forme> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.formeRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.formeRepository.remove(entity);
  }
}
