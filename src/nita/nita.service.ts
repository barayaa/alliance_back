import { Injectable } from '@nestjs/common';
import { CreateNitaDto } from './dto/create-nita.dto';
import { UpdateNitaDto } from './dto/update-nita.dto';
import { Nita } from './entities/nita.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class NitaService {
  constructor(
    @InjectRepository(Nita)
    private readonly nitaRepository: Repository<Nita>,
  ) {}
  create(createNitaDto: CreateNitaDto) {
    return this.nitaRepository.save(createNitaDto);
  }

  findAll() {
    return this.nitaRepository.find({ relations: ['depenses'] });
  }

  findOne(id: number) {
    return this.nitaRepository.findOne({
      where: { id_nita: id },
      relations: ['depenses'],
    });
  }

  update(id: number, updateNitaDto: UpdateNitaDto) {
    return this.nitaRepository.update(id, updateNitaDto);
  }

  //
  remove(id: number) {
    return this.nitaRepository.delete(id);
  }
}
