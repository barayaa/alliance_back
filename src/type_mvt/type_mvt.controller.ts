
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TypeMvtService } from './type_mvt.service';
import { CreateTypeMvtDto } from './dto/create-type_mvt.dto';
import { UpdateTypeMvtDto } from './dto/update-type_mvt.dto';
import { TypeMvt } from './type_mvt.entity';

@Controller('type_mvt')
export class TypeMvtController {
  constructor(private readonly type_mvtService: TypeMvtService) {}

  @Get()
  async findAll(): Promise<TypeMvt[]> {
    return this.type_mvtService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TypeMvt> {
    return this.type_mvtService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateTypeMvtDto): Promise<TypeMvt> {
    return this.type_mvtService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateTypeMvtDto): Promise<TypeMvt> {
    return this.type_mvtService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.type_mvtService.remove(+id);
  }
}
