import { Module } from '@nestjs/common';
import { BanquesService } from './banques.service';
import { BanquesController } from './banques.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Banque } from './entities/banque.entity';
import { Compte } from 'src/comptes/entities/compte.entity';
import { Depense } from 'src/depense/entities/depense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Banque, Compte, Depense])],
  controllers: [BanquesController],
  providers: [BanquesService],
})
export class BanquesModule {}
