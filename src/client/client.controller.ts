import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './client.entity';
import { Response } from 'express';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('count')
  async getTotalClients(
    @Query() dto: { date_debut?: string; date_fin?: string },
  ) {
    try {
      return await this.clientService.getTotalClients(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('with-details')
  async findAllWithDetails() {
    return this.clientService.findAllWithDetails();
  }

  @Get()
  async findAll(@Query('search') searchTerm: string) {
    return this.clientService.findAll(searchTerm);
  }

  @Get('export-excel')
  async exportToExcel(@Res() res: Response): Promise<void> {
    console.log('Controller exportToExcel called');
    await this.clientService.exportToExcel(res);
  }
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Client> {
    return this.clientService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateClientDto): Promise<Client> {
    return this.clientService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateClientDto,
  ): Promise<Client> {
    return this.clientService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.clientService.remove(+id);
  }
}
