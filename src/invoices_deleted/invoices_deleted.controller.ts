
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { InvoicesDeletedService } from './invoices_deleted.service';
import { CreateInvoicesDeletedDto } from './dto/create-invoices_deleted.dto';
import { UpdateInvoicesDeletedDto } from './dto/update-invoices_deleted.dto';
import { InvoicesDeleted } from './invoices_deleted.entity';

@Controller('invoices_deleted')
export class InvoicesDeletedController {
  constructor(private readonly invoices_deletedService: InvoicesDeletedService) {}

  @Get()
  async findAll(): Promise<InvoicesDeleted[]> {
    return this.invoices_deletedService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<InvoicesDeleted> {
    return this.invoices_deletedService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateInvoicesDeletedDto): Promise<InvoicesDeleted> {
    return this.invoices_deletedService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateInvoicesDeletedDto): Promise<InvoicesDeleted> {
    return this.invoices_deletedService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.invoices_deletedService.remove(+id);
  }
}
