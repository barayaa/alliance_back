import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandeAchat } from './commande_achat.entity';
import { CommandeAchatService } from './commande_achat.service';
import { CommandeAchatController } from './commande_achat.controller';
import { LignesCommandeAchat } from '../lignes_commande_achat/lignes_commande_achat.entity';
import { LignesCommandeAchatModule } from '../lignes_commande_achat/lignes_commande_achat.module';
import { TitulaireAmm } from '../titulaire_amm/titulaire_amm.entity';
import { Destination } from '../destination/destination.entity';
import { Produit } from '../produit/produit.entity';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';
import { Fournisseur } from 'src/fournisseur/fournisseur.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommandeAchat,
      LignesCommandeAchat,
      TitulaireAmm,
      Destination,
      Produit, // Ajouté
      MMvtStock,
      Fournisseur,
      LignesCommandeVente,
    ]),
    // LignesCommandeAchatModule,
    forwardRef(() => LignesCommandeAchatModule), // Utilisation de forwardRef
  ],
  controllers: [CommandeAchatController],
  providers: [CommandeAchatService],
  exports: [CommandeAchatService],
})
export class CommandeAchatModule {}
