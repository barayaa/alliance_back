import { Module } from '@nestjs/common';
import { DepenseService } from './depense.service';
import { DepenseController } from './depense.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Depense } from './entities/depense.entity';
import { Compte } from 'src/comptes/entities/compte.entity';
import { Caisse } from 'src/caisse/entities/caisse.entity';
import { TypeReglement } from 'src/type_reglement/type_reglement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Depense, Compte, Caisse, TypeReglement])],
  controllers: [DepenseController],
  providers: [DepenseService],
})
export class DepenseModule {}
