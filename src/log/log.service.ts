import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from './log.entity';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(Log)
    private logRepository: Repository<Log>,
  ) {}

  async findAll(): Promise<Log[]> {
    return this.logRepository.find({
      order: {
        id_log: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<Log> {
    const entity = await this.logRepository.findOne({ where: { id_log: id } });
    if (!entity) throw new NotFoundException('Log not found');
    return entity;
  }

  async create(dto: CreateLogDto): Promise<Log> {
    const entity = this.logRepository.create(dto);
    return this.logRepository.save(entity);
  }

  async update(id: number, dto: UpdateLogDto): Promise<Log> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.logRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.logRepository.remove(entity);
  }
}
