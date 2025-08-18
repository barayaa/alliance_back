
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ConformiteService } from './conformite.service';
import { CreateConformiteDto } from './dto/create-conformite.dto';
import { UpdateConformiteDto } from './dto/update-conformite.dto';
import { Conformite } from './conformite.entity';

@Controller('conformite')
export class ConformiteController {
  constructor(private readonly conformiteService: ConformiteService) {}

  @Get()
  async findAll(): Promise<Conformite[]> {
    return this.conformiteService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Conformite> {
    return this.conformiteService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateConformiteDto): Promise<Conformite> {
    return this.conformiteService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateConformiteDto): Promise<Conformite> {
    return this.conformiteService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.conformiteService.remove(+id);
  }
}
