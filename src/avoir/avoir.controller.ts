import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
  Res,
} from '@nestjs/common';
import { AvoirService } from './avoir.service';
import { CreateAvoirDto } from './dto/create-avoir.dto';
import { UpdateAvoirDto } from './dto/update-avoir.dto';
import { GetAvoirsDto } from './dto/get-avoir.dto';
import { Response } from 'express';
import { Auth } from 'src/auth/decorators/auth.decorators';
import { AuthType } from 'src/auth/enums/auth.types.enum';

@Controller('avoir')
export class AvoirController {
  constructor(private readonly avoirService: AvoirService) {}

  @Auth(AuthType.None)
  @Get('print-pdf/:id')
  async printAvoir(
    @Param('id') id: number,
    @Query('type') type: 'full' | 'simple' = 'full',
    @Res() res: Response,
  ) {
    console.log('Paramètres reçus:', { id, type });
    await this.avoirService.printAvoirToPdf(id, res, type);
  }

  @Get()
  findAll() {
    return this.avoirService.findAll();
  }

  @Post()
  async createAvoir(@Body() createAvoirDto: CreateAvoirDto) {
    return this.avoirService.createAvoir(createAvoirDto);
  }

  @Get(':id')
  findOne(@Body('id') id: number) {
    return this.avoirService.findOne(id);
  }

  @Get('search')
  getAvoirs(@Query() dto: GetAvoirsDto) {
    return this.avoirService.getAvoirs(dto);
  }

  @Get('export')
  async exportAvoirs(@Query() dto: GetAvoirsDto, @Res() res: Response) {
    await this.avoirService.exportAvoirsToExcel(dto, res);
  }
}
