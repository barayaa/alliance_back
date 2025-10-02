import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  BadRequestException,
  Query,
  Res,
} from '@nestjs/common';
import { ProformatService } from './proformat.service';
import { CreateProformatDto } from './dto/create-proformat.dto';
import { UpdateProformatDto } from './dto/update-proformat.dto';
import { Proformat } from './proformat.entity';
import { Response } from 'express';
import { Auth } from 'src/auth/decorators/auth.decorators';
import { AuthType } from 'src/auth/enums/auth.types.enum';

@Controller('proformat')
export class ProformatController {
  constructor(private readonly proformatService: ProformatService) {}

  @Auth(AuthType.None)
  @Get(':id/pdf')
  async generatePdf(@Param('id') id: string, @Res() res: Response) {
    await this.proformatService.generatePdf(+id, res);
  }

  @Get('client/:id_client')
  async findByclient(
    @Param('id_client') id_client: number,
  ): Promise<Proformat[]> {
    return this.proformatService.findByclient(id_client);
  }

  @Post('create-by-client') async createProformatByclient(
    @Body() createDto: CreateProformatDto,
    @Body('user') user: { id_client: number; login: string },
  ): Promise<Proformat> {
    return this.proformatService.createByclient(createDto, user);
  }

  @Post(':id/convert-to-commande-vente')
  async convertToCommandeVente(
    @Param('id') id: number,
    @Body('login') login: string,
  ) {
    return this.proformatService.convertToCommandeVente(id, login);
  }

  @Get('by-year')
  async findAllByYear(@Query('year') year?: string): Promise<Proformat[]> {
    const yearNumber = year ? parseInt(year, 10) : new Date().getFullYear();
    if (year && isNaN(yearNumber)) {
      throw new BadRequestException('Année invalide');
    }
    return this.proformatService.findAllByYear(yearNumber);
  }

  // @Get('print/:id')
  // async print(@Param('id') id: string, @Res() res: Response): Promise<void> {
  //   const idNumber = parseInt(id, 10);
  //   if (isNaN(idNumber)) {
  //     throw new BadRequestException('ID invalide');
  //   }
  //   return this.proformatService.generatePdf(idNumber, res);
  // }

  @Get()
  async findAll(
    @Query('date_debut') date_debut?: string,
    @Query('date_fin') date_fin?: string,
  ): Promise<Proformat[]> {
    return this.proformatService.findAll(date_debut, date_fin);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Proformat> {
    const idNumber = parseInt(id, 10);
    if (isNaN(idNumber)) {
      throw new BadRequestException('ID invalide');
    }
    return this.proformatService.findOne(idNumber);
  }

  @Delete('cancel/:id')
  async cancel(@Param('id') id: string): Promise<void> {
    const idNumber = parseInt(id, 10);
    if (isNaN(idNumber)) {
      throw new BadRequestException('ID invalide');
    }
    return this.proformatService.cancel(idNumber);
  }

  @Post()
  async create(@Body() createDto: CreateProformatDto): Promise<Proformat> {
    return this.proformatService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProformatDto,
  ): Promise<Proformat> {
    return this.proformatService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.proformatService.remove(+id);
  }
}
