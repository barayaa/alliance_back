
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntreesDeleted } from './entrees_deleted.entity';
import { CreateEntreesDeletedDto } from './dto/create-entrees_deleted.dto';
import { UpdateEntreesDeletedDto } from './dto/update-entrees_deleted.dto';

@Injectable()
export class EntreesDeletedService {
  constructor(
    @InjectRepository(EntreesDeleted)
    private entrees_deletedRepository: Repository<EntreesDeleted>,
  ) {}

  async findAll(): Promise<EntreesDeleted[]> {
    return this.entrees_deletedRepository.find();
  }

  async findOne(id: number): Promise<EntreesDeleted> {
    const entity = await this.entrees_deletedRepository.findOne({ where: { id_entrees_deleted: id } });
    if (!entity) throw new NotFoundException('EntreesDeleted not found');
    return entity;
  }

  async create(dto: CreateEntreesDeletedDto): Promise<EntreesDeleted> {
    const entity = this.entrees_deletedRepository.create(dto);
    return this.entrees_deletedRepository.save(entity);
  }

  async update(id: number, dto: UpdateEntreesDeletedDto): Promise<EntreesDeleted> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.entrees_deletedRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.entrees_deletedRepository.remove(entity);
  }
}
