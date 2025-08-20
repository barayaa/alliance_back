import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import {
  PaymentDistributionResult,
  ReglementService,
} from './reglement.service';
import { CreateReglementDto } from './dto/create-reglement.dto';
import { UpdateReglementDto } from './dto/update-reglement.dto';
import { Reglement } from './reglement.entity';

@Controller('reglement')
export class ReglementController {
  constructor(private readonly reglementService: ReglementService) {}

  @Post()
  // @ApiOperation({
  //   summary:
  //     'Créer un règlement avec répartition automatique sur les factures impayées',
  // })
  // @ApiResponse({
  //   status: 201,
  //   description: 'Règlement créé avec succès',
  //   type: PaymentDistributionResult,
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Données invalides ou erreur lors de la création',
  // })
  async createReglement(
    @Body(ValidationPipe) createReglementDto: CreateReglementDto,
  ): Promise<PaymentDistributionResult> {
    try {
      return await this.reglementService.createReglement(createReglementDto);
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Erreur lors de la création du règlement',
      );
    }
  }

  @Get('historique/:id_client')
  async findHistoriqueByClient(
    @Param('id_client') id_client: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ): Promise<any> {
    try {
      return await this.reglementService.findHistoriqueByClient(
        parseInt(id_client, 10),
        dateDebut,
        dateFin,
      );
    } catch (error) {
      throw error instanceof BadRequestException ||
        error instanceof NotFoundException
        ? error
        : new BadRequestException(
            "Erreur lors de la récupération de l'historique des règlements",
          );
    }
  }

  @Get()
  async findAll(): Promise<Reglement[]> {
    return this.reglementService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Reglement> {
    return this.reglementService.findOne(+id);
  }

  // @Post()
  // async create(@Body() createDto: CreateReglementDto): Promise<Reglement> {
  //   return this.reglementService.create(createDto);
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() updateDto: UpdateReglementDto): Promise<Reglement> {
  //   return this.reglementService.update(+id, updateDto);
  // }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.reglementService.remove(+id);
  }
}
