
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Isb } from './isb.entity';
import { CreateIsbDto } from './dto/create-isb.dto';
import { UpdateIsbDto } from './dto/update-isb.dto';

@Injectable()
export class IsbService {
  constructor(
    @InjectRepository(Isb)
    private isbRepository: Repository<Isb>,
  ) {}

  async findAll(): Promise<Isb[]> {
    return this.isbRepository.find();
  }

  async findOne(id: number): Promise<Isb> {
    const entity = await this.isbRepository.findOne({ where: { id_isb: id } });
    if (!entity) throw new NotFoundException('Isb not found');
    return entity;
  }

  async create(dto: CreateIsbDto): Promise<Isb> {
    const entity = this.isbRepository.create(dto);
    return this.isbRepository.save(entity);
  }

  async update(id: number, dto: UpdateIsbDto): Promise<Isb> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.isbRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.isbRepository.remove(entity);
  }
}
