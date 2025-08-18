
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destination } from './destination.entity';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

@Injectable()
export class DestinationService {
  constructor(
    @InjectRepository(Destination)
    private destinationRepository: Repository<Destination>,
  ) {}

  async findAll(): Promise<Destination[]> {
    return this.destinationRepository.find();
  }

  async findOne(id: number): Promise<Destination> {
    const entity = await this.destinationRepository.findOne({ where: { id_destination: id } });
    if (!entity) throw new NotFoundException('Destination not found');
    return entity;
  }

  async create(dto: CreateDestinationDto): Promise<Destination> {
    const entity = this.destinationRepository.create(dto);
    return this.destinationRepository.save(entity);
  }

  async update(id: number, dto: UpdateDestinationDto): Promise<Destination> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.destinationRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.destinationRepository.remove(entity);
  }
}
