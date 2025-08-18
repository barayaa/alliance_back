
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReleveFactures } from './releve_factures.entity';
import { CreateReleveFacturesDto } from './dto/create-releve_factures.dto';
import { UpdateReleveFacturesDto } from './dto/update-releve_factures.dto';

@Injectable()
export class ReleveFacturesService {
  constructor(
    @InjectRepository(ReleveFactures)
    private releve_facturesRepository: Repository<ReleveFactures>,
  ) {}

  async findAll(): Promise<ReleveFactures[]> {
    return this.releve_facturesRepository.find();
  }

  async findOne(id: number): Promise<ReleveFactures> {
    const entity = await this.releve_facturesRepository.findOne({ where: { id_releve_factures: id } });
    if (!entity) throw new NotFoundException('ReleveFactures not found');
    return entity;
  }

  async create(dto: CreateReleveFacturesDto): Promise<ReleveFactures> {
    const entity = this.releve_facturesRepository.create(dto);
    return this.releve_facturesRepository.save(entity);
  }

  async update(id: number, dto: UpdateReleveFacturesDto): Promise<ReleveFactures> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.releve_facturesRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.releve_facturesRepository.remove(entity);
  }
}
