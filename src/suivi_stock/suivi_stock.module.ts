import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuiviStock } from './suivi_stock.entity';
import { SuiviStockService } from './suivi_stock.service';
import { SuiviStockController } from './suivi_stock.controller';
import { Produit } from '../produit/produit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SuiviStock, Produit])],
  controllers: [SuiviStockController],
  providers: [SuiviStockService],
})
export class SuiviStockModule {}
