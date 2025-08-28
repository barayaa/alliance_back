import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { AvoirService } from './avoir.service';
import { CreateAvoirDto } from './dto/create-avoir.dto';
import { UpdateAvoirDto } from './dto/update-avoir.dto';

@Controller('avoir')
export class AvoirController {
  constructor(private readonly avoirService: AvoirService) {}

  @Get()
  findAll() {
    return this.avoirService.findAll();
  }

  @Post()
  async createAvoir(@Body() createAvoirDto: CreateAvoirDto) {
    return this.avoirService.createAvoir(createAvoirDto);
  }
}
