
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { RemiseService } from './remise.service';
import { CreateRemiseDto } from './dto/create-remise.dto';
import { UpdateRemiseDto } from './dto/update-remise.dto';
import { Remise } from './remise.entity';

@Controller('remise')
export class RemiseController {
  constructor(private readonly remiseService: RemiseService) {}

  @Get()
  async findAll(): Promise<Remise[]> {
    return this.remiseService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Remise> {
    return this.remiseService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateRemiseDto): Promise<Remise> {
    return this.remiseService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateRemiseDto): Promise<Remise> {
    return this.remiseService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.remiseService.remove(+id);
  }
}
