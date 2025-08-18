
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { StatutService } from './statut.service';
import { CreateStatutDto } from './dto/create-statut.dto';
import { UpdateStatutDto } from './dto/update-statut.dto';
import { Statut } from './statut.entity';

@Controller('statut')
export class StatutController {
  constructor(private readonly statutService: StatutService) {}

  @Get()
  async findAll(): Promise<Statut[]> {
    return this.statutService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Statut> {
    return this.statutService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateStatutDto): Promise<Statut> {
    return this.statutService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateStatutDto): Promise<Statut> {
    return this.statutService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.statutService.remove(+id);
  }
}
