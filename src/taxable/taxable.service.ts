
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Taxable } from './taxable.entity';
import { CreateTaxableDto } from './dto/create-taxable.dto';
import { UpdateTaxableDto } from './dto/update-taxable.dto';

@Injectable()
export class TaxableService {
  constructor(
    @InjectRepository(Taxable)
    private taxableRepository: Repository<Taxable>,
  ) {}

  async findAll(): Promise<Taxable[]> {
    return this.taxableRepository.find();
  }

  async findOne(id: number): Promise<Taxable> {
    const entity = await this.taxableRepository.findOne({ where: { id_taxable: id } });
    if (!entity) throw new NotFoundException('Taxable not found');
    return entity;
  }

  async create(dto: CreateTaxableDto): Promise<Taxable> {
    const entity = this.taxableRepository.create(dto);
    return this.taxableRepository.save(entity);
  }

  async update(id: number, dto: UpdateTaxableDto): Promise<Taxable> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.taxableRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.taxableRepository.remove(entity);
  }
}
