import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MouvementCompteService } from './mouvement_compte.service';
import { CreateMouvementCompteDto } from './dto/create-mouvement_compte.dto';
import { UpdateMouvementCompteDto } from './dto/update-mouvement_compte.dto';

@Controller('mouvement-compte')
export class MouvementCompteController {
  constructor(
    private readonly mouvementCompteService: MouvementCompteService,
  ) {}

  @Get(':id_compte')
  getMouvementsCompte(@Param('id_compte') id_compte: number) {
    return this.mouvementCompteService.getMouvementsCompte(id_compte);
  }
}
