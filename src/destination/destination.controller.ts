
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { DestinationService } from './destination.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { Destination } from './destination.entity';

@Controller('destination')
export class DestinationController {
  constructor(private readonly destinationService: DestinationService) {}

  @Get()
  async findAll(): Promise<Destination[]> {
    return this.destinationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Destination> {
    return this.destinationService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateDestinationDto): Promise<Destination> {
    return this.destinationService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateDestinationDto): Promise<Destination> {
    return this.destinationService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.destinationService.remove(+id);
  }
}
