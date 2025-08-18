import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TitulaireAmm } from './titulaire_amm.entity';
import { TitulaireAmmService } from './titulaire_amm.service';
import { TitulaireAmmController } from './titulaire_amm.controller';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { Produit } from '../produit/produit.entity';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TitulaireAmm,
      CommandeVente,
      Produit,
      LignesCommandeVente,
    ]),
  ],
  controllers: [TitulaireAmmController],
  providers: [TitulaireAmmService],
})
export class TitulaireAmmModule {}
