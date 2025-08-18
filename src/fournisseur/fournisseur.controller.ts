
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { FournisseurService } from './fournisseur.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';
import { Fournisseur } from './fournisseur.entity';

@Controller('fournisseur')
export class FournisseurController {
  constructor(private readonly fournisseurService: FournisseurService) {}

  @Get()
  async findAll(): Promise<Fournisseur[]> {
    return this.fournisseurService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Fournisseur> {
    return this.fournisseurService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateFournisseurDto): Promise<Fournisseur> {
    return this.fournisseurService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateFournisseurDto): Promise<Fournisseur> {
    return this.fournisseurService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.fournisseurService.remove(+id);
  }
}
