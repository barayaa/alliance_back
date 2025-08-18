
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeStat } from './type_stat.entity';
import { CreateTypeStatDto } from './dto/create-type_stat.dto';
import { UpdateTypeStatDto } from './dto/update-type_stat.dto';

@Injectable()
export class TypeStatService {
  constructor(
    @InjectRepository(TypeStat)
    private type_statRepository: Repository<TypeStat>,
  ) {}

  async findAll(): Promise<TypeStat[]> {
    return this.type_statRepository.find();
  }

  async findOne(id: number): Promise<TypeStat> {
    const entity = await this.type_statRepository.findOne({ where: { id_type_stat: id } });
    if (!entity) throw new NotFoundException('TypeStat not found');
    return entity;
  }

  async create(dto: CreateTypeStatDto): Promise<TypeStat> {
    const entity = this.type_statRepository.create(dto);
    return this.type_statRepository.save(entity);
  }

  async update(id: number, dto: UpdateTypeStatDto): Promise<TypeStat> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.type_statRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.type_statRepository.remove(entity);
  }
}
