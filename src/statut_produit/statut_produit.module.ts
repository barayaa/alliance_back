
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutProduit } from './statut_produit.entity';
import { StatutProduitService } from './statut_produit.service';
import { StatutProduitController } from './statut_produit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StatutProduit])],
  controllers: [StatutProduitController],
  providers: [StatutProduitService],
})
export class StatutProduitModule {}
