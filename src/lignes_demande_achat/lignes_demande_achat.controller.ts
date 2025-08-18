
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { LignesDemandeAchatService } from './lignes_demande_achat.service';
import { CreateLignesDemandeAchatDto } from './dto/create-lignes_demande_achat.dto';
import { UpdateLignesDemandeAchatDto } from './dto/update-lignes_demande_achat.dto';
import { LignesDemandeAchat } from './lignes_demande_achat.entity';

@Controller('lignes_demande_achat')
export class LignesDemandeAchatController {
  constructor(private readonly lignes_demande_achatService: LignesDemandeAchatService) {}

  @Get()
  async findAll(): Promise<LignesDemandeAchat[]> {
    return this.lignes_demande_achatService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LignesDemandeAchat> {
    return this.lignes_demande_achatService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateLignesDemandeAchatDto): Promise<LignesDemandeAchat> {
    return this.lignes_demande_achatService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateLignesDemandeAchatDto): Promise<LignesDemandeAchat> {
    return this.lignes_demande_achatService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.lignes_demande_achatService.remove(+id);
  }
}
