import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandeVente } from './commande_vente.entity';
import { CommandeVenteService } from './commande_vente.service';
import { CommandeVenteController } from './commande_vente.controller';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';
import { Produit } from '../produit/produit.entity';
import { Client } from '../client/client.entity';
import { LignesCommandeVenteModule } from '../lignes_commande_vente/lignes_commande_vente.module';
import { Isb } from '../isb/isb.entity';
import { Remise } from '../remise/remise.entity';
import { TypeReglement } from '../type_reglement/type_reglement.entity';
import { CaptureStockModule } from 'src/capture_stock/capture_stock.module';
import { LogModule } from 'src/log/log.module';
import { MMvtStock } from 'src/m_mvt_stock/m_mvt_stock.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommandeVente,
      Produit,
      LignesCommandeVente,
      Client,
      Isb,
      Remise,
      TypeReglement,
      MMvtStock,
    ]),
    LignesCommandeVenteModule,
    CaptureStockModule,
    LogModule,
  ],
  controllers: [CommandeVenteController],
  providers: [CommandeVenteService],
})
export class CommandeVenteModule {}
