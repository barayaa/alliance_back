import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './client.entity';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { Produit } from '../produit/produit.entity';
import { TitulaireAmm } from '../titulaire_amm/titulaire_amm.entity';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      CommandeVente,
      Produit,
      TitulaireAmm,
      LignesCommandeVente,
    ]),
  ],
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule {}
