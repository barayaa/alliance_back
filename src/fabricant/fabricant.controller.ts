
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { FabricantService } from './fabricant.service';
import { CreateFabricantDto } from './dto/create-fabricant.dto';
import { UpdateFabricantDto } from './dto/update-fabricant.dto';
import { Fabricant } from './fabricant.entity';

@Controller('fabricant')
export class FabricantController {
  constructor(private readonly fabricantService: FabricantService) {}

  @Get()
  async findAll(): Promise<Fabricant[]> {
    return this.fabricantService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Fabricant> {
    return this.fabricantService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateFabricantDto): Promise<Fabricant> {
    return this.fabricantService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateFabricantDto): Promise<Fabricant> {
    return this.fabricantService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.fabricantService.remove(+id);
  }
}
