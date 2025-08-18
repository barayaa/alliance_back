
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxGroup } from './tax_group.entity';
import { TaxGroupService } from './tax_group.service';
import { TaxGroupController } from './tax_group.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaxGroup])],
  controllers: [TaxGroupController],
  providers: [TaxGroupService],
})
export class TaxGroupModule {}
