import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MouvementNitaService } from './mouvement_nita.service';
import { CreateMouvementNitaDto } from './dto/create-mouvement_nita.dto';
import { UpdateMouvementNitaDto } from './dto/update-mouvement_nita.dto';

@Controller('mouvement-nita')
export class MouvementNitaController {
  constructor(private readonly mouvementNitaService: MouvementNitaService) {}

  @Get(':id_nita')
  getMouvementsNita(@Param('id_nita') id_nita: number) {
    return this.mouvementNitaService.getMouvementsNita(id_nita);
  }
}
