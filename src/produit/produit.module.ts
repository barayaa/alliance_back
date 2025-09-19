import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produit } from './produit.entity';
import { ProduitService } from './produit.service';
import { ProduitController } from './produit.controller';
import { SuiviStock } from '../suivi_stock/suivi_stock.entity';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';
import { Audit } from 'src/audit/entities/audit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Produit,
      SuiviStock,
      LignesCommandeVente,
      MMvtStock,
      Audit,
    ]),
  ],
  controllers: [ProduitController],
  providers: [ProduitService],
})
export class ProduitModule {}
