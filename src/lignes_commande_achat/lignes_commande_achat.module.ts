import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LignesCommandeAchat } from './lignes_commande_achat.entity';
import { LignesCommandeAchatService } from './lignes_commande_achat.service';
import { LignesCommandeAchatController } from './lignes_commande_achat.controller';
import { Produit } from '../produit/produit.entity';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';
import { CommandeAchat } from '../commande_achat/commande_achat.entity';
import { CommandeAchatModule } from '../commande_achat/commande_achat.module';
import { CaptureStockModule } from 'src/capture_stock/capture_stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LignesCommandeAchat,
      MMvtStock,
      Produit,
      CommandeAchat,
    ]),
    CaptureStockModule,
    forwardRef(() => CommandeAchatModule), // Casser la circularité
  ],
  controllers: [LignesCommandeAchatController],
  providers: [LignesCommandeAchatService],
  exports: [LignesCommandeAchatService], // Exporter pour utilisation dans CommandeAchatModule
})
export class LignesCommandeAchatModule {}
