import { Injectable } from '@nestjs/common';
import { CreateMouvementNitaDto } from './dto/create-mouvement_nita.dto';
import { UpdateMouvementNitaDto } from './dto/update-mouvement_nita.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MouvementNita } from './entities/mouvement_nita.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MouvementNitaService {
  constructor(
    @InjectRepository(MouvementNita)
    private mouvementNitaRepository: Repository<MouvementNita>,
  ) {}

  getMouvementsNita(id_nita: number) {
    return this.mouvementNitaRepository.find({
      where: { id_nita },
      order: { date_mouvement: 'DESC' },
      relations: ['depense'],
    });
  }
}
