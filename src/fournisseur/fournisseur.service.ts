
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fournisseur } from './fournisseur.entity';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';

@Injectable()
export class FournisseurService {
  constructor(
    @InjectRepository(Fournisseur)
    private fournisseurRepository: Repository<Fournisseur>,
  ) {}

  async findAll(): Promise<Fournisseur[]> {
    return this.fournisseurRepository.find();
  }

  async findOne(id: number): Promise<Fournisseur> {
    const entity = await this.fournisseurRepository.findOne({ where: { id_fournisseur: id } });
    if (!entity) throw new NotFoundException('Fournisseur not found');
    return entity;
  }

  async create(dto: CreateFournisseurDto): Promise<Fournisseur> {
    const entity = this.fournisseurRepository.create(dto);
    return this.fournisseurRepository.save(entity);
  }

  async update(id: number, dto: UpdateFournisseurDto): Promise<Fournisseur> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.fournisseurRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.fournisseurRepository.remove(entity);
  }
}
