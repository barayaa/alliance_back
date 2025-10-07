import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NitaService } from './nita.service';
import { CreateNitaDto } from './dto/create-nita.dto';
import { UpdateNitaDto } from './dto/update-nita.dto';

@Controller('nita')
export class NitaController {
  constructor(private readonly nitaService: NitaService) {}

  @Post()
  create(@Body() createNitaDto: CreateNitaDto) {
    return this.nitaService.create(createNitaDto);
  }

  @Get()
  findAll() {
    return this.nitaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nitaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNitaDto: UpdateNitaDto) {
    return this.nitaService.update(+id, updateNitaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nitaService.remove(+id);
  }
}
