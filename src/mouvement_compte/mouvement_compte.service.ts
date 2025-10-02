import { Injectable } from '@nestjs/common';
import { CreateMouvementCompteDto } from './dto/create-mouvement_compte.dto';
import { UpdateMouvementCompteDto } from './dto/update-mouvement_compte.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MouvementCompte } from './entities/mouvement_compte.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MouvementCompteService {
  constructor(
    @InjectRepository(MouvementCompte)
    private mouvementCompteRepository: Repository<MouvementCompte>,
  ) {}

  getMouvementsCompte(id_compte: number) {
    return this.mouvementCompteRepository.find({
      where: { id_compte },
      order: { date_mouvement: 'DESC' },
      relations: ['reglement', 'depense'],
    });
  }
}
