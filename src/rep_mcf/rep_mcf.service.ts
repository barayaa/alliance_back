
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepMcf } from './rep_mcf.entity';
import { CreateRepMcfDto } from './dto/create-rep_mcf.dto';
import { UpdateRepMcfDto } from './dto/update-rep_mcf.dto';

@Injectable()
export class RepMcfService {
  constructor(
    @InjectRepository(RepMcf)
    private rep_mcfRepository: Repository<RepMcf>,
  ) {}

  async findAll(): Promise<RepMcf[]> {
    return this.rep_mcfRepository.find();
  }

  async findOne(id: number): Promise<RepMcf> {
    const entity = await this.rep_mcfRepository.findOne({ where: { id_rep_mcf: id } });
    if (!entity) throw new NotFoundException('RepMcf not found');
    return entity;
  }

  async create(dto: CreateRepMcfDto): Promise<RepMcf> {
    const entity = this.rep_mcfRepository.create(dto);
    return this.rep_mcfRepository.save(entity);
  }

  async update(id: number, dto: UpdateRepMcfDto): Promise<RepMcf> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.rep_mcfRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.rep_mcfRepository.remove(entity);
  }
}
