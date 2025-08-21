import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ComptesService } from './comptes.service';
import { CreateCompteDto } from './dto/create-compte.dto';
import { UpdateCompteDto } from './dto/update-compte.dto';

@Controller('compte')
export class ComptesController {
  constructor(private readonly comptesService: ComptesService) {}

  @Get('id_banque/:id_banque')
  findCompteByBanqueId(@Param('id_banque') id_banque: string) {
    return this.comptesService.findCompteByBanqueId(+id_banque);
  }

  @Post()
  create(@Body() createCompteDto: CreateCompteDto) {
    return this.comptesService.create(createCompteDto);
  }

  @Get()
  findAll() {
    return this.comptesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.comptesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompteDto: UpdateCompteDto) {
    return this.comptesService.update(+id, updateCompteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.comptesService.remove(+id);
  }
}
