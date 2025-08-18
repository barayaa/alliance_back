
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { StatutProduitService } from './statut_produit.service';
import { CreateStatutProduitDto } from './dto/create-statut_produit.dto';
import { UpdateStatutProduitDto } from './dto/update-statut_produit.dto';
import { StatutProduit } from './statut_produit.entity';

@Controller('statut_produit')
export class StatutProduitController {
  constructor(private readonly statut_produitService: StatutProduitService) {}

  @Get()
  async findAll(): Promise<StatutProduit[]> {
    return this.statut_produitService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<StatutProduit> {
    return this.statut_produitService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateStatutProduitDto): Promise<StatutProduit> {
    return this.statut_produitService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateStatutProduitDto): Promise<StatutProduit> {
    return this.statut_produitService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.statut_produitService.remove(+id);
  }
}
