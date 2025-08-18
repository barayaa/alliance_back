
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeMvt } from './type_mvt.entity';
import { CreateTypeMvtDto } from './dto/create-type_mvt.dto';
import { UpdateTypeMvtDto } from './dto/update-type_mvt.dto';

@Injectable()
export class TypeMvtService {
  constructor(
    @InjectRepository(TypeMvt)
    private type_mvtRepository: Repository<TypeMvt>,
  ) {}

  async findAll(): Promise<TypeMvt[]> {
    return this.type_mvtRepository.find();
  }

  async findOne(id: number): Promise<TypeMvt> {
    const entity = await this.type_mvtRepository.findOne({ where: { id_type_mvt: id } });
    if (!entity) throw new NotFoundException('TypeMvt not found');
    return entity;
  }

  async create(dto: CreateTypeMvtDto): Promise<TypeMvt> {
    const entity = this.type_mvtRepository.create(dto);
    return this.type_mvtRepository.save(entity);
  }

  async update(id: number, dto: UpdateTypeMvtDto): Promise<TypeMvt> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.type_mvtRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.type_mvtRepository.remove(entity);
  }
}
