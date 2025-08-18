
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TaxableService } from './taxable.service';
import { CreateTaxableDto } from './dto/create-taxable.dto';
import { UpdateTaxableDto } from './dto/update-taxable.dto';
import { Taxable } from './taxable.entity';

@Controller('taxable')
export class TaxableController {
  constructor(private readonly taxableService: TaxableService) {}

  @Get()
  async findAll(): Promise<Taxable[]> {
    return this.taxableService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Taxable> {
    return this.taxableService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateTaxableDto): Promise<Taxable> {
    return this.taxableService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateTaxableDto): Promise<Taxable> {
    return this.taxableService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.taxableService.remove(+id);
  }
}
