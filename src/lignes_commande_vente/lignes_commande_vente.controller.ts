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
import { LignesCommandeVenteService } from './lignes_commande_vente.service';
import { CreateLignesCommandeVenteDto } from './dto/create-lignes_commande_vente.dto';
import { UpdateLignesCommandeVenteDto } from './dto/update-lignes_commande_vente.dto';
import { LignesCommandeVente } from './lignes_commande_vente.entity';

@Controller('lignes_commande_vente')
export class LignesCommandeVenteController {
  constructor(
    private readonly lignes_commande_venteService: LignesCommandeVenteService,
  ) {}

  @Get()
  async findAll(): Promise<LignesCommandeVente[]> {
    return this.lignes_commande_venteService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LignesCommandeVente> {
    return this.lignes_commande_venteService.findOne(+id);
  }

  // @Post()
  // async create(@Body() createDto: CreateLignesCommandeVenteDto): Promise<LignesCommandeVente> {
  //   return this.lignes_commande_venteService.create(createDto);
  // }

  // @Post()
  // async create(
  //   @Body() createDto: CreateLignesCommandeVenteDto,
  // ): Promise<LignesCommandeVente> {
  //   if (!createDto.ligne || !createDto.id_commande_vente || !createDto.login) {
  //     throw new BadRequestException(
  //       'Missing required fields: ligne, id_commande_vente, or login',
  //     );
  //   }
  //   return this.lignes_commande_venteService.create(
  //     createDto.ligne,
  //     createDto.id_commande_vente,
  //     createDto.login,
  //   );
  // }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLignesCommandeVenteDto,
  ): Promise<LignesCommandeVente> {
    return this.lignes_commande_venteService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.lignes_commande_venteService.remove(+id);
  }
}
