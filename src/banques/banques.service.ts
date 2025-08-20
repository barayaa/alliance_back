import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBanqueDto } from './dto/create-banque.dto';
import { UpdateBanqueDto } from './dto/update-banque.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Banque } from './entities/banque.entity';
import { Repository } from 'typeorm';
import { Compte } from 'src/comptes/entities/compte.entity';

@Injectable()
export class BanquesService {
  constructor(
    // Inject any necessary repositories or services here
    @InjectRepository(Banque)
    private readonly banqueRepository: Repository<Banque>,

    // @InjectRepository(Compte) private readonly compteRepository: Repository<Compte>,
  ) {}

  create(createBanqueDto: CreateBanqueDto) {
    const banque = this.banqueRepository.create(createBanqueDto);
    return this.banqueRepository.save(banque);
  }

  findAll() {
    return this.banqueRepository.find({ relations: ['comptes'] });
  }

  findOne(id: number) {
    const banque = this.banqueRepository.findOne({
      where: { id_banque: id },
      relations: ['comptes'],
    });
    if (!banque) {
      throw new NotFoundException(`Banque with ID ${id} not found`);
    }
    return banque;
  }

  update(id: number, updateBanqueDto: UpdateBanqueDto) {
    return this.banqueRepository.update(id, updateBanqueDto).then((result) => {
      if (result.affected === 0) {
        throw new NotFoundException(`Banque with ID ${id} not found`);
      }
      return this.findOne(id);
    });
  }

  remove(id: number) {
    return this.banqueRepository.delete(id).then((result) => {
      if (result.affected === 0) {
        throw new NotFoundException(`Banque with ID ${id} not found`);
      }
      return { message: `Banque with ID ${id} deleted successfully` };
    });
  }
}
