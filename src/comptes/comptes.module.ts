import { Module } from '@nestjs/common';
import { ComptesService } from './comptes.service';
import { ComptesController } from './comptes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Compte } from './entities/compte.entity';
import { Banque } from 'src/banques/entities/banque.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Compte, Banque]), // Ensure you import the Compte entity
  ],
  controllers: [ComptesController],
  providers: [ComptesService],
})
export class ComptesModule {}
