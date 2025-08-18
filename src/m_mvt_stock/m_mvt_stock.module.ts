import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MMvtStock } from './m_mvt_stock.entity';
import { MMvtStockService } from './m_mvt_stock.service';
import { MMvtStockController } from './m_mvt_stock.controller';
import { TypeMvt } from '../type_mvt/type_mvt.entity';
import { Produit } from '../produit/produit.entity';
import { Marque } from '../marque/marque.entity';
import { Client } from '../client/client.entity';
import { TitulaireAmm } from '../titulaire_amm/titulaire_amm.entity';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { CaptureStock } from '../capture_stock/capture_stock.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MMvtStock,
      TypeMvt,
      Produit,
      Marque,
      Client,
      TitulaireAmm,
      CommandeVente,
      CaptureStock,
      User,
    ]),
  ],
  controllers: [MMvtStockController],
  providers: [MMvtStockService],
})
export class MMvtStockModule {}
