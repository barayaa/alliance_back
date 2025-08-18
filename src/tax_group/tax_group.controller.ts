
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TaxGroupService } from './tax_group.service';
import { CreateTaxGroupDto } from './dto/create-tax_group.dto';
import { UpdateTaxGroupDto } from './dto/update-tax_group.dto';
import { TaxGroup } from './tax_group.entity';

@Controller('tax_group')
export class TaxGroupController {
  constructor(private readonly tax_groupService: TaxGroupService) {}

  @Get()
  async findAll(): Promise<TaxGroup[]> {
    return this.tax_groupService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TaxGroup> {
    return this.tax_groupService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateTaxGroupDto): Promise<TaxGroup> {
    return this.tax_groupService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateTaxGroupDto): Promise<TaxGroup> {
    return this.tax_groupService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.tax_groupService.remove(+id);
  }
}
