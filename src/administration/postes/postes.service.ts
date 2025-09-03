import { Injectable } from '@nestjs/common';
import { CreatePosteDto } from './dto/create-poste.dto';
import { UpdatePosteDto } from './dto/update-poste.dto';

@Injectable()
export class PostesService {
  create(createPosteDto: CreatePosteDto) {
    return 'This action adds a new poste';
  }

  findAll() {
    return `This action returns all postes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} poste`;
  }

  update(id: number, updatePosteDto: UpdatePosteDto) {
    return `This action updates a #${id} poste`;
  }

  remove(id: number) {
    return `This action removes a #${id} poste`;
  }
}
