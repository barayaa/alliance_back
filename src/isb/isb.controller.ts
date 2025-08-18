
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { IsbService } from './isb.service';
import { CreateIsbDto } from './dto/create-isb.dto';
import { UpdateIsbDto } from './dto/update-isb.dto';
import { Isb } from './isb.entity';

@Controller('isb')
export class IsbController {
  constructor(private readonly isbService: IsbService) {}

  @Get()
  async findAll(): Promise<Isb[]> {
    return this.isbService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Isb> {
    return this.isbService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateIsbDto): Promise<Isb> {
    return this.isbService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateIsbDto): Promise<Isb> {
    return this.isbService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.isbService.remove(+id);
  }
}
