
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ClasseTherapeutiqueService } from './classe_therapeutique.service';
import { CreateClasseTherapeutiqueDto } from './dto/create-classe_therapeutique.dto';
import { UpdateClasseTherapeutiqueDto } from './dto/update-classe_therapeutique.dto';
import { ClasseTherapeutique } from './classe_therapeutique.entity';

@Controller('classe_therapeutique')
export class ClasseTherapeutiqueController {
  constructor(private readonly classe_therapeutiqueService: ClasseTherapeutiqueService) {}

  @Get()
  async findAll(): Promise<ClasseTherapeutique[]> {
    return this.classe_therapeutiqueService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ClasseTherapeutique> {
    return this.classe_therapeutiqueService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateClasseTherapeutiqueDto): Promise<ClasseTherapeutique> {
    return this.classe_therapeutiqueService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateClasseTherapeutiqueDto): Promise<ClasseTherapeutique> {
    return this.classe_therapeutiqueService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.classe_therapeutiqueService.remove(+id);
  }
}
