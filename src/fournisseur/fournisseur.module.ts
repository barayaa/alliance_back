
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fournisseur } from './fournisseur.entity';
import { FournisseurService } from './fournisseur.service';
import { FournisseurController } from './fournisseur.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Fournisseur])],
  controllers: [FournisseurController],
  providers: [FournisseurService],
})
export class FournisseurModule {}
