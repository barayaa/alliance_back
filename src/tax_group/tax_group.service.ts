
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxGroup } from './tax_group.entity';
import { CreateTaxGroupDto } from './dto/create-tax_group.dto';
import { UpdateTaxGroupDto } from './dto/update-tax_group.dto';

@Injectable()
export class TaxGroupService {
  constructor(
    @InjectRepository(TaxGroup)
    private tax_groupRepository: Repository<TaxGroup>,
  ) {}

  async findAll(): Promise<TaxGroup[]> {
    return this.tax_groupRepository.find();
  }

  async findOne(id: number): Promise<TaxGroup> {
    const entity = await this.tax_groupRepository.findOne({ where: { id_tax_group: id } });
    if (!entity) throw new NotFoundException('TaxGroup not found');
    return entity;
  }

  async create(dto: CreateTaxGroupDto): Promise<TaxGroup> {
    const entity = this.tax_groupRepository.create(dto);
    return this.tax_groupRepository.save(entity);
  }

  async update(id: number, dto: UpdateTaxGroupDto): Promise<TaxGroup> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.tax_groupRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.tax_groupRepository.remove(entity);
  }
}
