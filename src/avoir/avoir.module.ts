import { Module } from '@nestjs/common';
import { AvoirService } from './avoir.service';
import { AvoirController } from './avoir.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Avoir } from './entities/avoir.entity';
import { Isb } from 'src/isb/isb.entity';
import { Client } from 'src/client/client.entity';
import { Produit } from 'src/produit/produit.entity';
import { TypeReglement } from 'src/type_reglement/type_reglement.entity';
import { CommandeVente } from 'src/commande_vente/commande_vente.entity';
import { MMvtStock } from 'src/m_mvt_stock/m_mvt_stock.entity';
import { LigneAvoir } from 'src/ligne_avoir/entities/ligne_avoir.entity';
import { CaptureStockModule } from 'src/capture_stock/capture_stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Avoir,
      Isb,
      Client,
      Produit,
      TypeReglement,
      CommandeVente,
      MMvtStock,
      LigneAvoir,
    ]),
    CaptureStockModule,
  ],
  controllers: [AvoirController],
  providers: [AvoirService],
})
export class AvoirModule {}
