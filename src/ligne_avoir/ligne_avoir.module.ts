import { Module } from '@nestjs/common';
import { LigneAvoirService } from './ligne_avoir.service';
import { LigneAvoirController } from './ligne_avoir.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigneAvoir } from './entities/ligne_avoir.entity';
import { Avoir } from 'src/avoir/entities/avoir.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LigneAvoir, Avoir])],
  controllers: [LigneAvoirController],
  providers: [LigneAvoirService],
})
export class LigneAvoirModule {}
