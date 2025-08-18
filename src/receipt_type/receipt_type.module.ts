
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptType } from './receipt_type.entity';
import { ReceiptTypeService } from './receipt_type.service';
import { ReceiptTypeController } from './receipt_type.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReceiptType])],
  controllers: [ReceiptTypeController],
  providers: [ReceiptTypeService],
})
export class ReceiptTypeModule {}
