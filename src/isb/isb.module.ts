
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Isb } from './isb.entity';
import { IsbService } from './isb.service';
import { IsbController } from './isb.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Isb])],
  controllers: [IsbController],
  providers: [IsbService],
})
export class IsbModule {}
