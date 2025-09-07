import { Module } from '@nestjs/common';
import { PostesService } from './postes.service';
import { PostesController } from './postes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Direction } from 'src/direction/entities/direction.entity';
import { Poste } from './entities/poste.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Poste, Direction])],
  controllers: [PostesController],
  providers: [PostesService],
})
export class PostesModule {}
