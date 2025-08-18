
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClasseTherapeutique } from './classe_therapeutique.entity';
import { CreateClasseTherapeutiqueDto } from './dto/create-classe_therapeutique.dto';
import { UpdateClasseTherapeutiqueDto } from './dto/update-classe_therapeutique.dto';

@Injectable()
export class ClasseTherapeutiqueService {
  constructor(
    @InjectRepository(ClasseTherapeutique)
    private classe_therapeutiqueRepository: Repository<ClasseTherapeutique>,
  ) {}

  async findAll(): Promise<ClasseTherapeutique[]> {
    return this.classe_therapeutiqueRepository.find();
  }

  async findOne(id: number): Promise<ClasseTherapeutique> {
    const entity = await this.classe_therapeutiqueRepository.findOne({ where: { id_classe_therapeutique: id } });
    if (!entity) throw new NotFoundException('ClasseTherapeutique not found');
    return entity;
  }

  async create(dto: CreateClasseTherapeutiqueDto): Promise<ClasseTherapeutique> {
    const entity = this.classe_therapeutiqueRepository.create(dto);
    return this.classe_therapeutiqueRepository.save(entity);
  }

  async update(id: number, dto: UpdateClasseTherapeutiqueDto): Promise<ClasseTherapeutique> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.classe_therapeutiqueRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.classe_therapeutiqueRepository.remove(entity);
  }
}
