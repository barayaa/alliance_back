
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { MoyenReglementService } from './moyen_reglement.service';
import { CreateMoyenReglementDto } from './dto/create-moyen_reglement.dto';
import { UpdateMoyenReglementDto } from './dto/update-moyen_reglement.dto';
import { MoyenReglement } from './moyen_reglement.entity';

@Controller('moyen_reglement')
export class MoyenReglementController {
  constructor(private readonly moyen_reglementService: MoyenReglementService) {}

  @Get()
  async findAll(): Promise<MoyenReglement[]> {
    return this.moyen_reglementService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MoyenReglement> {
    return this.moyen_reglementService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateMoyenReglementDto): Promise<MoyenReglement> {
    return this.moyen_reglementService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateMoyenReglementDto): Promise<MoyenReglement> {
    return this.moyen_reglementService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.moyen_reglementService.remove(+id);
  }
}
