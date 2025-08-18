
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { FicheVisiteService } from './fiche_visite.service';
import { CreateFicheVisiteDto } from './dto/create-fiche_visite.dto';
import { UpdateFicheVisiteDto } from './dto/update-fiche_visite.dto';
import { FicheVisite } from './fiche_visite.entity';

@Controller('fiche_visite')
export class FicheVisiteController {
  constructor(private readonly fiche_visiteService: FicheVisiteService) {}

  @Get()
  async findAll(): Promise<FicheVisite[]> {
    return this.fiche_visiteService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<FicheVisite> {
    return this.fiche_visiteService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateFicheVisiteDto): Promise<FicheVisite> {
    return this.fiche_visiteService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateFicheVisiteDto): Promise<FicheVisite> {
    return this.fiche_visiteService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.fiche_visiteService.remove(+id);
  }
}
