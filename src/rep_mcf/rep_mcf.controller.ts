
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { RepMcfService } from './rep_mcf.service';
import { CreateRepMcfDto } from './dto/create-rep_mcf.dto';
import { UpdateRepMcfDto } from './dto/update-rep_mcf.dto';
import { RepMcf } from './rep_mcf.entity';

@Controller('rep_mcf')
export class RepMcfController {
  constructor(private readonly rep_mcfService: RepMcfService) {}

  @Get()
  async findAll(): Promise<RepMcf[]> {
    return this.rep_mcfService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RepMcf> {
    return this.rep_mcfService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateRepMcfDto): Promise<RepMcf> {
    return this.rep_mcfService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateRepMcfDto): Promise<RepMcf> {
    return this.rep_mcfService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.rep_mcfService.remove(+id);
  }
}
