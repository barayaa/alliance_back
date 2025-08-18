
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TypeReglementService } from './type_reglement.service';
import { CreateTypeReglementDto } from './dto/create-type_reglement.dto';
import { UpdateTypeReglementDto } from './dto/update-type_reglement.dto';
import { TypeReglement } from './type_reglement.entity';

@Controller('type_reglement')
export class TypeReglementController {
  constructor(private readonly type_reglementService: TypeReglementService) {}

  @Get()
  async findAll(): Promise<TypeReglement[]> {
    return this.type_reglementService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TypeReglement> {
    return this.type_reglementService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateTypeReglementDto): Promise<TypeReglement> {
    return this.type_reglementService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateTypeReglementDto): Promise<TypeReglement> {
    return this.type_reglementService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.type_reglementService.remove(+id);
  }
}
