
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ReceiptTypeService } from './receipt_type.service';
import { CreateReceiptTypeDto } from './dto/create-receipt_type.dto';
import { UpdateReceiptTypeDto } from './dto/update-receipt_type.dto';
import { ReceiptType } from './receipt_type.entity';

@Controller('receipt_type')
export class ReceiptTypeController {
  constructor(private readonly receipt_typeService: ReceiptTypeService) {}

  @Get()
  async findAll(): Promise<ReceiptType[]> {
    return this.receipt_typeService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ReceiptType> {
    return this.receipt_typeService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateReceiptTypeDto): Promise<ReceiptType> {
    return this.receipt_typeService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateReceiptTypeDto): Promise<ReceiptType> {
    return this.receipt_typeService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.receipt_typeService.remove(+id);
  }
}
