import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fabricant } from './fabricant.entity';
import { CreateFabricantDto } from './dto/create-fabricant.dto';
import { UpdateFabricantDto } from './dto/update-fabricant.dto';

@Injectable()
export class FabricantService {
  constructor(
    @InjectRepository(Fabricant)
    private fabricantRepository: Repository<Fabricant>,
  ) {}

  async findAll(): Promise<Fabricant[]> {
    return this.fabricantRepository.find({
      relations: {
        produits: true,
      },
    });
  }

  async findOne(id: number): Promise<Fabricant> {
    const entity = await this.fabricantRepository.findOne({
      where: { id_fabricant: id },
    });
    if (!entity) throw new NotFoundException('Fabricant not found');
    return entity;
  }

  async create(dto: CreateFabricantDto): Promise<Fabricant> {
    const entity = this.fabricantRepository.create(dto);
    return this.fabricantRepository.save(entity);
  }

  async update(id: number, dto: UpdateFabricantDto): Promise<Fabricant> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.fabricantRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.fabricantRepository.remove(entity);
  }
}
