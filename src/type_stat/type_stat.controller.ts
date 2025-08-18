
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TypeStatService } from './type_stat.service';
import { CreateTypeStatDto } from './dto/create-type_stat.dto';
import { UpdateTypeStatDto } from './dto/update-type_stat.dto';
import { TypeStat } from './type_stat.entity';

@Controller('type_stat')
export class TypeStatController {
  constructor(private readonly type_statService: TypeStatService) {}

  @Get()
  async findAll(): Promise<TypeStat[]> {
    return this.type_statService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TypeStat> {
    return this.type_statService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateTypeStatDto): Promise<TypeStat> {
    return this.type_statService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateTypeStatDto): Promise<TypeStat> {
    return this.type_statService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.type_statService.remove(+id);
  }
}
