import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proformat } from './proformat.entity';
import { ProformatService } from './proformat.service';
import { ProformatController } from './proformat.controller';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';
import { LignesProformat } from '../lignes_proformat/lignes_proformat.entity';
import { Client } from '../client/client.entity';
import { Produit } from '../produit/produit.entity';
import { CaptureStockModule } from 'src/capture_stock/capture_stock.module';
import { LignesCommandeVenteModule } from 'src/lignes_commande_vente/lignes_commande_vente.module';
import { Log } from 'src/log/log.entity';
import { Isb } from 'src/isb/isb.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Proformat,
      LignesCommandeVente,
      LignesProformat,
      Client,
      Produit,
      Log,
      Isb,
    ]),
    CaptureStockModule,
    LignesCommandeVenteModule,
  ],
  controllers: [ProformatController],
  providers: [ProformatService],
})
export class ProformatModule {}
