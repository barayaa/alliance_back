
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ReleveFacturesService } from './releve_factures.service';
import { CreateReleveFacturesDto } from './dto/create-releve_factures.dto';
import { UpdateReleveFacturesDto } from './dto/update-releve_factures.dto';
import { ReleveFactures } from './releve_factures.entity';

@Controller('releve_factures')
export class ReleveFacturesController {
  constructor(private readonly releve_facturesService: ReleveFacturesService) {}

  @Get()
  async findAll(): Promise<ReleveFactures[]> {
    return this.releve_facturesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ReleveFactures> {
    return this.releve_facturesService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateReleveFacturesDto): Promise<ReleveFactures> {
    return this.releve_facturesService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateReleveFacturesDto): Promise<ReleveFactures> {
    return this.releve_facturesService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.releve_facturesService.remove(+id);
  }
}
