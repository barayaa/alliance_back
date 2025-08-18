
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { LogService } from './log.service';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { Log } from './log.entity';

@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get()
  async findAll(): Promise<Log[]> {
    return this.logService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Log> {
    return this.logService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateLogDto): Promise<Log> {
    return this.logService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateLogDto): Promise<Log> {
    return this.logService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.logService.remove(+id);
  }
}
