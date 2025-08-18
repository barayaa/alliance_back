
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Taxable } from './taxable.entity';
import { TaxableService } from './taxable.service';
import { TaxableController } from './taxable.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Taxable])],
  controllers: [TaxableController],
  providers: [TaxableService],
})
export class TaxableModule {}
