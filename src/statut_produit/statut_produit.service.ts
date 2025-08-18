
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatutProduit } from './statut_produit.entity';
import { CreateStatutProduitDto } from './dto/create-statut_produit.dto';
import { UpdateStatutProduitDto } from './dto/update-statut_produit.dto';

@Injectable()
export class StatutProduitService {
  constructor(
    @InjectRepository(StatutProduit)
    private statut_produitRepository: Repository<StatutProduit>,
  ) {}

  async findAll(): Promise<StatutProduit[]> {
    return this.statut_produitRepository.find();
  }

  async findOne(id: number): Promise<StatutProduit> {
    const entity = await this.statut_produitRepository.findOne({ where: { id_statut_produit: id } });
    if (!entity) throw new NotFoundException('StatutProduit not found');
    return entity;
  }

  async create(dto: CreateStatutProduitDto): Promise<StatutProduit> {
    const entity = this.statut_produitRepository.create(dto);
    return this.statut_produitRepository.save(entity);
  }

  async update(id: number, dto: UpdateStatutProduitDto): Promise<StatutProduit> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.statut_produitRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.statut_produitRepository.remove(entity);
  }
}
