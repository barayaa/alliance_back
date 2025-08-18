
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { FormeService } from './forme.service';
import { CreateFormeDto } from './dto/create-forme.dto';
import { UpdateFormeDto } from './dto/update-forme.dto';
import { Forme } from './forme.entity';

@Controller('forme')
export class FormeController {
  constructor(private readonly formeService: FormeService) {}

  @Get()
  async findAll(): Promise<Forme[]> {
    return this.formeService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Forme> {
    return this.formeService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateFormeDto): Promise<Forme> {
    return this.formeService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateFormeDto): Promise<Forme> {
    return this.formeService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.formeService.remove(+id);
  }
}
