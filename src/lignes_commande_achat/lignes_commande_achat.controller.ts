import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Request,
} from '@nestjs/common';
import { LignesCommandeAchatService } from './lignes_commande_achat.service';
import { CreateLignesCommandeAchatDto } from './dto/create-lignes_commande_achat.dto';
import { UpdateLignesCommandeAchatDto } from './dto/update-lignes_commande_achat.dto';
import { LignesCommandeAchat } from './lignes_commande_achat.entity';
import { User } from '../user/user.entity';
import { CreateLignesCommandeAchatPayloadDto } from './dto/create-lignes-commande-achat-payload.dto';

@Controller('lignes_commande_achat')
export class LignesCommandeAchatController {
  constructor(
    private readonly lignes_commande_achatService: LignesCommandeAchatService,
  ) {}

  @Get()
  async findAll(): Promise<LignesCommandeAchat[]> {
    return this.lignes_commande_achatService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LignesCommandeAchat> {
    return this.lignes_commande_achatService.findOne(+id);
  }

  // @Post()
  // async create(
  //   @Body() payload: CreateLignesCommandeAchatPayloadDto,
  //   @Request() req: { user: User },
  // ): Promise<LignesCommandeAchat> {
  //   const { ligne, reference, id_destination } = payload;
  //   return this.lignes_commande_achatService.create(
  //     ligne,
  //     req.user.login,
  //     reference,
  //     id_destination,
  //   );
  // }
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLignesCommandeAchatDto,
  ): Promise<LignesCommandeAchat> {
    return this.lignes_commande_achatService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.lignes_commande_achatService.remove(+id);
  }
}
