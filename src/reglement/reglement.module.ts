import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reglement } from './reglement.entity';
import { ReglementService } from './reglement.service';
import { ReglementController } from './reglement.controller';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { Client } from '../client/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reglement, CommandeVente, Client])],
  controllers: [ReglementController],
  providers: [ReglementService],
})
export class ReglementModule {}
