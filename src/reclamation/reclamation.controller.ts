import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ReclamationService } from './reclamation.service';
import { CreateReclamationDto } from './dto/create-reclamation.dto';
import { UpdateReclamationDto } from './dto/update-reclamation.dto';
import { Reclamation } from './reclamation.entity';
import { NatureReclamation } from '../nature_reclamation/nature_reclamation.entity';

@Controller('reclamation')
export class ReclamationController {
  constructor(private readonly reclamationService: ReclamationService) {}

  @Get()
  async findAll(): Promise<Reclamation[]> {
    return this.reclamationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Reclamation> {
    return this.reclamationService.findOne(+id);
  }

  @Post()
  async create(@Body() dto: CreateReclamationDto): Promise<Reclamation> {
    if (
      !dto.quantite ||
      !dto.prix_grossiste ||
      !dto.numero_facture ||
      !dto.date ||
      !dto.cle_produit ||
      !dto.cle_nature_reclamation
    ) {
      throw new BadRequestException('Tous les champs sont requis');
    }
    return this.reclamationService.create(dto);
  }

  @Get('natures')
  async findNatureReclamations(): Promise<NatureReclamation[]> {
    return this.reclamationService.findNatureReclamations();
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReclamationDto,
  ): Promise<Reclamation> {
    return this.reclamationService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.reclamationService.remove(+id);
  }
}
