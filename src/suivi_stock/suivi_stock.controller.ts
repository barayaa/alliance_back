import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { SuiviStockService } from './suivi_stock.service';
import { CreateSuiviStockDto } from './dto/create-suivi_stock.dto';
import { UpdateSuiviStockDto } from './dto/update-suivi_stock.dto';
import { SuiviStock } from './suivi_stock.entity';

@Controller('suivi_stock')
export class SuiviStockController {
  constructor(private readonly suivi_stockService: SuiviStockService) {}

  @Get('export')
  async exportToExcel(
    @Query('searchTerm') searchTerm: string,
    @Query('date') date: string,
    @Query('dateDebut') dateDebut: string,
    @Query('dateFin') dateFin: string,
  ) {
    console.log('Controller received params:', {
      searchTerm,
      date,
      dateDebut,
      dateFin,
    }); // Log pour déboguer
    const buffer = await this.suivi_stockService.exportToExcel(
      searchTerm,
      date,
      dateDebut,
      dateFin,
    );
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="suivi_stocks.xlsx"',
    });
  }

  @Get()
  async findAll(): Promise<SuiviStock[]> {
    return this.suivi_stockService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SuiviStock> {
    return this.suivi_stockService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateSuiviStockDto): Promise<SuiviStock> {
    return this.suivi_stockService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSuiviStockDto,
  ): Promise<SuiviStock> {
    return this.suivi_stockService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.suivi_stockService.remove(+id);
  }
}
