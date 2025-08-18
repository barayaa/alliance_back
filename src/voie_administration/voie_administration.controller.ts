
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { VoieAdministrationService } from './voie_administration.service';
import { CreateVoieAdministrationDto } from './dto/create-voie_administration.dto';
import { UpdateVoieAdministrationDto } from './dto/update-voie_administration.dto';
import { VoieAdministration } from './voie_administration.entity';

@Controller('voie_administration')
export class VoieAdministrationController {
  constructor(private readonly voie_administrationService: VoieAdministrationService) {}

  @Get()
  async findAll(): Promise<VoieAdministration[]> {
    return this.voie_administrationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<VoieAdministration> {
    return this.voie_administrationService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateVoieAdministrationDto): Promise<VoieAdministration> {
    return this.voie_administrationService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateVoieAdministrationDto): Promise<VoieAdministration> {
    return this.voie_administrationService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.voie_administrationService.remove(+id);
  }
}
