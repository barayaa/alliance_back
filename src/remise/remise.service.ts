
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Remise } from './remise.entity';
import { CreateRemiseDto } from './dto/create-remise.dto';
import { UpdateRemiseDto } from './dto/update-remise.dto';

@Injectable()
export class RemiseService {
  constructor(
    @InjectRepository(Remise)
    private remiseRepository: Repository<Remise>,
  ) {}

  async findAll(): Promise<Remise[]> {
    return this.remiseRepository.find();
  }

  async findOne(id: number): Promise<Remise> {
    const entity = await this.remiseRepository.findOne({ where: { id_remise: id } });
    if (!entity) throw new NotFoundException('Remise not found');
    return entity;
  }

  async create(dto: CreateRemiseDto): Promise<Remise> {
    const entity = this.remiseRepository.create(dto);
    return this.remiseRepository.save(entity);
  }

  async update(id: number, dto: UpdateRemiseDto): Promise<Remise> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.remiseRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.remiseRepository.remove(entity);
  }
}
