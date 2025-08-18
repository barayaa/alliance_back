
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { LignesProformatService } from './lignes_proformat.service';
import { CreateLignesProformatDto } from './dto/create-lignes_proformat.dto';
import { UpdateLignesProformatDto } from './dto/update-lignes_proformat.dto';
import { LignesProformat } from './lignes_proformat.entity';

@Controller('lignes_proformat')
export class LignesProformatController {
  constructor(private readonly lignes_proformatService: LignesProformatService) {}

  @Get()
  async findAll(): Promise<LignesProformat[]> {
    return this.lignes_proformatService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LignesProformat> {
    return this.lignes_proformatService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateLignesProformatDto): Promise<LignesProformat> {
    return this.lignes_proformatService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateLignesProformatDto): Promise<LignesProformat> {
    return this.lignes_proformatService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.lignes_proformatService.remove(+id);
  }
}
