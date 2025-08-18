
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReceiptType } from './receipt_type.entity';
import { CreateReceiptTypeDto } from './dto/create-receipt_type.dto';
import { UpdateReceiptTypeDto } from './dto/update-receipt_type.dto';

@Injectable()
export class ReceiptTypeService {
  constructor(
    @InjectRepository(ReceiptType)
    private receipt_typeRepository: Repository<ReceiptType>,
  ) {}

  async findAll(): Promise<ReceiptType[]> {
    return this.receipt_typeRepository.find();
  }

  async findOne(id: number): Promise<ReceiptType> {
    const entity = await this.receipt_typeRepository.findOne({ where: { id_receipt_type: id } });
    if (!entity) throw new NotFoundException('ReceiptType not found');
    return entity;
  }

  async create(dto: CreateReceiptTypeDto): Promise<ReceiptType> {
    const entity = this.receipt_typeRepository.create(dto);
    return this.receipt_typeRepository.save(entity);
  }

  async update(id: number, dto: UpdateReceiptTypeDto): Promise<ReceiptType> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.receipt_typeRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.receipt_typeRepository.remove(entity);
  }
}
