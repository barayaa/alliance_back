
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { LogsFacturationService } from './logs_facturation.service';
import { CreateLogsFacturationDto } from './dto/create-logs_facturation.dto';
import { UpdateLogsFacturationDto } from './dto/update-logs_facturation.dto';
import { LogsFacturation } from './logs_facturation.entity';

@Controller('logs_facturation')
export class LogsFacturationController {
  constructor(private readonly logs_facturationService: LogsFacturationService) {}

  @Get()
  async findAll(): Promise<LogsFacturation[]> {
    return this.logs_facturationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LogsFacturation> {
    return this.logs_facturationService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateLogsFacturationDto): Promise<LogsFacturation> {
    return this.logs_facturationService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateLogsFacturationDto): Promise<LogsFacturation> {
    return this.logs_facturationService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.logs_facturationService.remove(+id);
  }
}
