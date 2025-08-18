
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesDeleted } from './invoices_deleted.entity';
import { InvoicesDeletedService } from './invoices_deleted.service';
import { InvoicesDeletedController } from './invoices_deleted.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InvoicesDeleted])],
  controllers: [InvoicesDeletedController],
  providers: [InvoicesDeletedService],
})
export class InvoicesDeletedModule {}
