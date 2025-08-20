import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCaisseDto } from './dto/create-caisse.dto';
import { UpdateCaisseDto } from './dto/update-caisse.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { Caisse } from './entities/caisse.entity';

@Injectable()
export class CaisseService {
  constructor(
    @InjectRepository(Caisse)
    private readonly caisseRepository: Repository<Caisse>,
  ) {}

  create(createCaisseDto: CreateCaisseDto) {
    const caisse = this.caisseRepository.create(createCaisseDto);
    return this.caisseRepository.save(caisse);
  }

  findAll() {
    return this.caisseRepository.find();
  }

  findOne(id: number) {
    return this.caisseRepository
      .findOne({
        where: { id_caisse: id },
      })
      .then((caisse) => {
        if (!caisse) {
          throw new NotFoundException(`Caisse avec l'ID ${id} non trouvée`);
        }
        return caisse;
      });
  }

  update(id: number, updateCaisseDto: UpdateCaisseDto) {
    return this.caisseRepository.update(id, updateCaisseDto).then((result) => {
      if (result.affected === 0) {
        throw new NotFoundException(`Caisse avec l'ID ${id} non trouvée`);
      }
      return this.findOne(id);
    });
  }

  remove(id: number) {
    return this.caisseRepository.delete(id).then((result) => {
      if (result.affected === 0) {
        throw new NotFoundException(`Caisse avec l'ID ${id} non trouvée`);
      }
      return { message: `Caisse avec l'ID ${id} supprimée avec succès` };
    });
  }
}
