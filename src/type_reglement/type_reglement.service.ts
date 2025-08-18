
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeReglement } from './type_reglement.entity';
import { CreateTypeReglementDto } from './dto/create-type_reglement.dto';
import { UpdateTypeReglementDto } from './dto/update-type_reglement.dto';

@Injectable()
export class TypeReglementService {
  constructor(
    @InjectRepository(TypeReglement)
    private type_reglementRepository: Repository<TypeReglement>,
  ) {}

  async findAll(): Promise<TypeReglement[]> {
    return this.type_reglementRepository.find();
  }

  async findOne(id: number): Promise<TypeReglement> {
    const entity = await this.type_reglementRepository.findOne({ where: { id_type_reglement: id } });
    if (!entity) throw new NotFoundException('TypeReglement not found');
    return entity;
  }

  async create(dto: CreateTypeReglementDto): Promise<TypeReglement> {
    const entity = this.type_reglementRepository.create(dto);
    return this.type_reglementRepository.save(entity);
  }

  async update(id: number, dto: UpdateTypeReglementDto): Promise<TypeReglement> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.type_reglementRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.type_reglementRepository.remove(entity);
  }
}
