import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptureStock } from './capture_stock.entity';
import { CaptureStockService } from './capture_stock.service';
import { CaptureStockController } from './capture_stock.controller';
import { Produit } from '../produit/produit.entity';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CaptureStock, Produit, MMvtStock])],
  controllers: [CaptureStockController],
  providers: [CaptureStockService],
  exports: [CaptureStockService], // Export the service if needed in other modules
})
export class CaptureStockModule {}
