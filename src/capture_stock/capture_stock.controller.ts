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
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { CreateCaptureStockDto } from './dto/create-capture_stock.dto';
import { UpdateCaptureStockDto } from './dto/update-capture_stock.dto';
import { CaptureStock } from './capture_stock.entity';
import { Response } from 'express';
import { CaptureStockService } from './capture_stock.service';

@Controller('capture_stock')
export class CaptureStockController {
  constructor(private readonly captureStockService: CaptureStockService) {}

  @Get('etat_stock')
  async getStockState(@Query('date') date: string) {
    return this.captureStockService.getStockStateByDate(date);
  }
  @Get()
  async findAll(): Promise<CaptureStock[]> {
    return this.captureStockService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CaptureStock> {
    console.log('findOne called with id:', id);
    return this.captureStockService.findOne(id);
  }

  @Post()
  async create(
    @Body() createDto: CreateCaptureStockDto,
  ): Promise<CaptureStock> {
    return this.captureStockService.create(createDto);
  }

  // @Put(':id')
  // async update(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() updateDto: UpdateCaptureStockDto,
  // ): Promise<CaptureStock> {
  //   console.log('update called with id:', id);
  //   return this.captureStockService.updateStockCapture(id, updateDto);
  // }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    console.log('remove called with id:', id);
    return this.captureStockService.remove(id);
  }

  @Get('etat_stock/export')
  async exportStockStateToExcel(
    @Query('date') date?: string,
    @Res() res?: Response,
  ) {
    console.log('exportStockStateToExcel called with date:', date);
    const buffer = await this.captureStockService.exportStockStateToExcel(date);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=etat_stock_${date || '2025-07-22'}.xlsx`,
    });
    res.send(buffer);
  }
}
