
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { MarqueService } from './marque.service';
import { CreateMarqueDto } from './dto/create-marque.dto';
import { UpdateMarqueDto } from './dto/update-marque.dto';
import { Marque } from './marque.entity';

@Controller('marque')
export class MarqueController {
  constructor(private readonly marqueService: MarqueService) {}

  @Get()
  async findAll(): Promise<Marque[]> {
    return this.marqueService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Marque> {
    return this.marqueService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateMarqueDto): Promise<Marque> {
    return this.marqueService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateMarqueDto): Promise<Marque> {
    return this.marqueService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.marqueService.remove(+id);
  }
}
