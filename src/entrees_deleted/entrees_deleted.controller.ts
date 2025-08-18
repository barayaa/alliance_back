
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { EntreesDeletedService } from './entrees_deleted.service';
import { CreateEntreesDeletedDto } from './dto/create-entrees_deleted.dto';
import { UpdateEntreesDeletedDto } from './dto/update-entrees_deleted.dto';
import { EntreesDeleted } from './entrees_deleted.entity';

@Controller('entrees_deleted')
export class EntreesDeletedController {
  constructor(private readonly entrees_deletedService: EntreesDeletedService) {}

  @Get()
  async findAll(): Promise<EntreesDeleted[]> {
    return this.entrees_deletedService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<EntreesDeleted> {
    return this.entrees_deletedService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateEntreesDeletedDto): Promise<EntreesDeleted> {
    return this.entrees_deletedService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateEntreesDeletedDto): Promise<EntreesDeleted> {
    return this.entrees_deletedService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.entrees_deletedService.remove(+id);
  }
}
