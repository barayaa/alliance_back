
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { DemandeAchatService } from './demande_achat.service';
import { CreateDemandeAchatDto } from './dto/create-demande_achat.dto';
import { UpdateDemandeAchatDto } from './dto/update-demande_achat.dto';
import { DemandeAchat } from './demande_achat.entity';

@Controller('demande_achat')
export class DemandeAchatController {
  constructor(private readonly demande_achatService: DemandeAchatService) {}

  @Get()
  async findAll(): Promise<DemandeAchat[]> {
    return this.demande_achatService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DemandeAchat> {
    return this.demande_achatService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateDemandeAchatDto): Promise<DemandeAchat> {
    return this.demande_achatService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateDemandeAchatDto): Promise<DemandeAchat> {
    return this.demande_achatService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.demande_achatService.remove(+id);
  }
}
