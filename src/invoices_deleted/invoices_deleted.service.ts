import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoicesDeleted } from './invoices_deleted.entity';
import { CreateInvoicesDeletedDto } from './dto/create-invoices_deleted.dto';
import { UpdateInvoicesDeletedDto } from './dto/update-invoices_deleted.dto';

@Injectable()
export class InvoicesDeletedService {
  constructor(
    @InjectRepository(InvoicesDeleted)
    private invoices_deletedRepository: Repository<InvoicesDeleted>,
  ) {}

  async findAll(): Promise<InvoicesDeleted[]> {
    return this.invoices_deletedRepository.find({});
  }

  async findOne(id: number): Promise<InvoicesDeleted> {
    const entity = await this.invoices_deletedRepository.findOne({
      where: { id_invoices_deleted: id },
    });
    if (!entity) throw new NotFoundException('InvoicesDeleted not found');
    return entity;
  }

  async create(dto: CreateInvoicesDeletedDto): Promise<InvoicesDeleted> {
    const entity = this.invoices_deletedRepository.create(dto);
    return this.invoices_deletedRepository.save(entity);
  }

  async update(
    id: number,
    dto: UpdateInvoicesDeletedDto,
  ): Promise<InvoicesDeleted> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.invoices_deletedRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.invoices_deletedRepository.remove(entity);
  }
}
