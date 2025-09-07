import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDirectionDto } from './dto/create-direction.dto';
import { UpdateDirectionDto } from './dto/update-direction.dto';
import { Direction } from './entities/direction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DirectionService {
  constructor(
    @InjectRepository(Direction)
    private directionRepository: Repository<Direction>,
  ) {}

  // Créer une nouvelle direction
  async create(createDirectionDto: CreateDirectionDto): Promise<Direction> {
    const direction = this.directionRepository.create(createDirectionDto);
    return this.directionRepository.save(direction);
  }

  // Récupérer toutes les directions (avec leurs postes associés)
  async findAll(): Promise<Direction[]> {
    return this.directionRepository.find({
      relations: ['postes'],
    });
  }

  // Récupérer une direction par ID (avec ses postes associés)
  async findOne(id: number): Promise<Direction> {
    const direction = await this.directionRepository.findOne({
      where: { id },
      relations: ['postes'],
    });
    if (!direction) {
      throw new NotFoundException(`Direction with ID ${id} not found`);
    }
    return direction;
  }

  // Mettre à jour une direction
  async update(
    id: number,
    updateDirectionDto: UpdateDirectionDto,
  ): Promise<Direction> {
    const direction = await this.findOne(id); // Vérifie si la direction existe
    Object.assign(direction, updateDirectionDto);
    return this.directionRepository.save(direction);
  }

  // Supprimer une direction
  async remove(id: number): Promise<void> {
    const direction = await this.findOne(id); // Vérifie si la direction existe
    await this.directionRepository.remove(direction);
  }
}
