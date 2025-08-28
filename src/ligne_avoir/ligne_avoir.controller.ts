import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LigneAvoirService } from './ligne_avoir.service';
import { CreateLigneAvoirDto } from './dto/create-ligne_avoir.dto';
import { UpdateLigneAvoirDto } from './dto/update-ligne_avoir.dto';

@Controller('ligne-avoir')
export class LigneAvoirController {
  constructor(private readonly ligneAvoirService: LigneAvoirService) {}

  @Post()
  create(@Body() createLigneAvoirDto: CreateLigneAvoirDto) {
    return this.ligneAvoirService.create(createLigneAvoirDto);
  }

  @Get()
  findAll() {
    return this.ligneAvoirService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ligneAvoirService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLigneAvoirDto: UpdateLigneAvoirDto) {
    return this.ligneAvoirService.update(+id, updateLigneAvoirDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ligneAvoirService.remove(+id);
  }
}
