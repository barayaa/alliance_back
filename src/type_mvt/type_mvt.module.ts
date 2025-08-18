import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeMvt } from './type_mvt.entity';
import { TypeMvtService } from './type_mvt.service';
import { TypeMvtController } from './type_mvt.controller';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TypeMvt, MMvtStock])],
  controllers: [TypeMvtController],
  providers: [TypeMvtService],
})
export class TypeMvtModule {}
