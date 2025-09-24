import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Request,
  Query,
  BadRequestException,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { CommandeAchatService } from './commande_achat.service';
import { CreateCommandeAchatDto } from './dto/create-commande_achat.dto';
import { UpdateCommandeAchatDto } from './dto/update-commande_achat.dto';
import { CommandeAchat } from './commande_achat.entity';
import { User } from '../user/user.entity';
import { Response } from 'express';

@Controller('commande_achat')
export class CommandeAchatController {
  constructor(private readonly commande_achatService: CommandeAchatService) {}

  @Get('export_inventaire')
  async exportStock(@Query('search') searchTerm: string, @Res() res: Response) {
    try {
      await this.commande_achatService.exportStockToExcel(searchTerm, res);
    } catch (error) {
      throw new HttpException(
        "Erreur lors de l'exportation du stock en Excel",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stock/all-products')
  async checkStockAllProducts() {
    return this.commande_achatService.checkStockAllProducts();
  }

  // @Get('stock/all-products')
  // async checkStockAllProducts(
  //   @Query('login') login: string,
  // ): Promise<StockConsistency[]> {
  //   if (!login) {
  //     throw new BadRequestException('Le paramètre login est requis');
  //   }
  //   return this.commande_achatService.checkStockAllProducts(login);
  // }

  // @Get()
  // async findAll(): Promise<CommandeAchat[]> {
  //   return this.commande_achatService.findAll();
  // }

  @Get()
  async findAll(
    @Query('date_debut') date_debut?: string,
    @Query('date_fin') date_fin?: string,
    @Query('reference') reference?: string,
  ): Promise<CommandeAchat[]> {
    return this.commande_achatService.findAll(date_debut, date_fin, reference);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CommandeAchat> {
    return this.commande_achatService.findOne(+id);
  }

  @Post()
  async create(
    @Body() createCommandeAchatDto: CreateCommandeAchatDto,
    @Request() req: { user: User },
  ): Promise<CommandeAchat> {
    return await this.commande_achatService.create(
      createCommandeAchatDto,
      req.user,
    );
  }
  // async create(
  //   @Body() createDto: CreateCommandeAchatDto,
  //   @Request() req: { user: User },
  // ): Promise<CommandeAchat> {
  //   return this.commande_achatService.create(createDto, req.user);
  // }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCommandeAchatDto,
  ): Promise<CommandeAchat> {
    return this.commande_achatService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.commande_achatService.remove(+id);
  }
}
