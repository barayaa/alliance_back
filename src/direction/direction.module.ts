import { Module } from '@nestjs/common';
import { DirectionService } from './direction.service';
import { DirectionController } from './direction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Poste } from 'src/postes/entities/poste.entity';
import { Direction } from './entities/direction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Direction, Poste])],
  controllers: [DirectionController],
  providers: [DirectionService],
})
export class DirectionModule {}
