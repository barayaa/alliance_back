import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FicheVisite } from './fiche_visite.entity';
import { CreateFicheVisiteDto } from './dto/create-fiche_visite.dto';
import { UpdateFicheVisiteDto } from './dto/update-fiche_visite.dto';

@Injectable()
export class FicheVisiteService {
  constructor(
    @InjectRepository(FicheVisite)
    private fiche_visiteRepository: Repository<FicheVisite>,
  ) {}

  async findAll(): Promise<FicheVisite[]> {
    return this.fiche_visiteRepository.find();
  }

  async findOne(id: number): Promise<FicheVisite> {
    const entity = await this.fiche_visiteRepository.findOne({
      where: { id_fiche_visite: id },
    });
    if (!entity) throw new NotFoundException('FicheVisite not found');
    return entity;
  }

  async create(dto: CreateFicheVisiteDto): Promise<FicheVisite> {
    const entity = this.fiche_visiteRepository.create(dto);
    return this.fiche_visiteRepository.save(entity);
  }

  async update(id: number, dto: UpdateFicheVisiteDto): Promise<FicheVisite> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.fiche_visiteRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.fiche_visiteRepository.remove(entity);
  }

  async getTotalProspections(dto: {
    date_debut?: string;
    date_fin?: string;
  }): Promise<number> {
    const query = this.fiche_visiteRepository.createQueryBuilder('fv');

    if (dto.date_debut && dto.date_fin) {
      query.andWhere('fv.date BETWEEN :date_debut AND :date_fin', {
        date_debut: dto.date_debut,
        date_fin: dto.date_fin,
      });
    }

    return query.getCount();
  }
}
