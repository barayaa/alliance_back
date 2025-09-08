import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reclamation } from './reclamation.entity';
import { ReclamationService } from './reclamation.service';
import { ReclamationController } from './reclamation.controller';
import { Produit } from '../produit/produit.entity';
import { NatureReclamation } from '../nature_reclamation/nature_reclamation.entity';
import { AvoirModule } from 'src/avoir/avoir.module';
import { CommandeVente } from 'src/commande_vente/commande_vente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reclamation,
      Produit,
      NatureReclamation,
      CommandeVente,
    ]),
    AvoirModule,
  ],
  controllers: [ReclamationController],
  providers: [ReclamationService],
})
export class ReclamationModule {}
