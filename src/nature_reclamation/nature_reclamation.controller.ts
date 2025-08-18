
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { NatureReclamationService } from './nature_reclamation.service';
import { CreateNatureReclamationDto } from './dto/create-nature_reclamation.dto';
import { UpdateNatureReclamationDto } from './dto/update-nature_reclamation.dto';
import { NatureReclamation } from './nature_reclamation.entity';

@Controller('nature_reclamation')
export class NatureReclamationController {
  constructor(private readonly nature_reclamationService: NatureReclamationService) {}

  @Get()
  async findAll(): Promise<NatureReclamation[]> {
    return this.nature_reclamationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<NatureReclamation> {
    return this.nature_reclamationService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateNatureReclamationDto): Promise<NatureReclamation> {
    return this.nature_reclamationService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateNatureReclamationDto): Promise<NatureReclamation> {
    return this.nature_reclamationService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.nature_reclamationService.remove(+id);
  }
}
