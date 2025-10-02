import { Injectable } from '@nestjs/common';
import { CreateMouvementCaisseDto } from './dto/create-mouvement_caisse.dto';
import { UpdateMouvementCaisseDto } from './dto/update-mouvement_caisse.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MouvementCaisse } from './entities/mouvement_caisse.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MouvementCaisseService {
  constructor(
    @InjectRepository(MouvementCaisse)
    private mouvementCaisseRepository: Repository<MouvementCaisse>,
  ) {}

  getMouvementsCaisse(id_caisse: number) {
    return this.mouvementCaisseRepository.find({
      where: { id_caisse },
      order: { date_mouvement: 'DESC' },
      relations: ['reglement', 'depense'],
    });
  }
}
