import { Module } from '@nestjs/common';
import { MouvementCompteService } from './mouvement_compte.service';
import { MouvementCompteController } from './mouvement_compte.controller';
import { MouvementCompte } from './entities/mouvement_compte.entity';
import { Reglement } from 'src/reglement/reglement.entity';
import { Compte } from 'src/comptes/entities/compte.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Depense } from 'src/depense/entities/depense.entity';

@Module({
  imports: [
    // Ajoutez ici les modules nécessaires, par exemple TypeOrmModule.forFeature([...])
    TypeOrmModule.forFeature([MouvementCompte, Reglement, Depense, Compte]),
  ],
  controllers: [MouvementCompteController],
  providers: [MouvementCompteService],
})
export class MouvementCompteModule {}
