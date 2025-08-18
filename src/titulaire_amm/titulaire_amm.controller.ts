import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Res,
  Query,
} from '@nestjs/common';
import { TitulaireAmmService } from './titulaire_amm.service';
import { CreateTitulaireAmmDto } from './dto/create-titulaire_amm.dto';
import { UpdateTitulaireAmmDto } from './dto/update-titulaire_amm.dto';
import { TitulaireAmm } from './titulaire_amm.entity';
import { Response } from 'express';

@Controller('titulaire_amm')
export class TitulaireAmmController {
  constructor(private readonly titulaire_ammService: TitulaireAmmService) {}
  @Get()
  async findAll(@Query('search') searchTerm: string) {
    return this.titulaire_ammService.findAll(searchTerm);
  }

  @Get('export-excel')
  async exportToExcel(@Res() res: Response): Promise<void> {
    console.log('Controller exportToExcel called');
    await this.titulaire_ammService.exportToExcel(res);
  }

  @Get(':id/invoices')
  findInvoicesByTitulaire(@Param('id') id: string) {
    return this.titulaire_ammService.findInvoicesByTitulaire(+id);
  }
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TitulaireAmm> {
    return this.titulaire_ammService.findOne(+id);
  }

  @Post()
  async create(
    @Body() createDto: CreateTitulaireAmmDto,
  ): Promise<TitulaireAmm> {
    return this.titulaire_ammService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTitulaireAmmDto,
  ): Promise<TitulaireAmm> {
    return this.titulaire_ammService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.titulaire_ammService.remove(+id);
  }
}
