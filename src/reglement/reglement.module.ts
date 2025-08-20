import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reglement } from './reglement.entity';
import { ReglementService } from './reglement.service';
import { ReglementController } from './reglement.controller';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { Client } from '../client/client.entity';
import { Caisse } from 'src/caisse/entities/caisse.entity';
import { Compte } from 'src/comptes/entities/compte.entity';
import { TypeReglement } from 'src/type_reglement/type_reglement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reglement,
      CommandeVente,
      Client,
      Caisse,
      Compte,
      TypeReglement,
    ]),
  ],
  controllers: [ReglementController],
  providers: [ReglementService],
})
export class ReglementModule {}
