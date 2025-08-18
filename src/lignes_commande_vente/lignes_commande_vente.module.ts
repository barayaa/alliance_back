import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LignesCommandeVente } from './lignes_commande_vente.entity';
import { LignesCommandeVenteService } from './lignes_commande_vente.service';
import { LignesCommandeVenteController } from './lignes_commande_vente.controller';
import { Produit } from '../produit/produit.entity';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';
import { ProduitModule } from '../produit/produit.module';
import { CaptureStockModule } from '../capture_stock/capture_stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LignesCommandeVente,
      Produit,
      CommandeVente,
      MMvtStock,
    ]),
    CaptureStockModule,
  ],
  controllers: [LignesCommandeVenteController],
  providers: [LignesCommandeVenteService],
  exports: [LignesCommandeVenteService],
})
export class LignesCommandeVenteModule {}
