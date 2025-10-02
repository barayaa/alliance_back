import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MouvementCaisseService } from './mouvement_caisse.service';
import { CreateMouvementCaisseDto } from './dto/create-mouvement_caisse.dto';
import { UpdateMouvementCaisseDto } from './dto/update-mouvement_caisse.dto';

@Controller('mouvement-caisse')
export class MouvementCaisseController {
  constructor(
    private readonly mouvementCaisseService: MouvementCaisseService,
  ) {}

  @Get(':id_caisse')
  getMouvementsCaisse(@Param('id_caisse') id_caisse: number) {
    return this.mouvementCaisseService.getMouvementsCaisse(id_caisse);
  }
}
