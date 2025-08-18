import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogsFacturation } from './logs_facturation.entity';
import { CreateLogsFacturationDto } from './dto/create-logs_facturation.dto';
import { UpdateLogsFacturationDto } from './dto/update-logs_facturation.dto';

@Injectable()
export class LogsFacturationService {
  constructor(
    @InjectRepository(LogsFacturation)
    private logs_facturationRepository: Repository<LogsFacturation>,
  ) {}

  async findAll(): Promise<LogsFacturation[]> {
    return this.logs_facturationRepository.find();
  }

  async findOne(id: number): Promise<LogsFacturation> {
    // Replace 'id_logs_facturation' with the actual primary key property name from LogsFacturation entity, e.g. 'id' or similar
    const entity = await this.logs_facturationRepository.findOne({
      where: { id: id },
    });
    if (!entity) throw new NotFoundException('LogsFacturation not found');
    return entity;
  }

  async create(dto: CreateLogsFacturationDto): Promise<LogsFacturation> {
    const entity = this.logs_facturationRepository.create(dto);
    return this.logs_facturationRepository.save(entity);
  }

  async update(
    id: number,
    dto: UpdateLogsFacturationDto,
  ): Promise<LogsFacturation> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.logs_facturationRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.logs_facturationRepository.remove(entity);
  }
}
