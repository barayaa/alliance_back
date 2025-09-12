import { Module } from '@nestjs/common';
import { PostesService } from './postes.service';
import { PostesController } from './postes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Direction } from 'src/direction/entities/direction.entity';
import { Poste } from './entities/poste.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { User } from 'src/user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Poste, Direction, Menu, User])],
  controllers: [PostesController],
  providers: [PostesService],
})
export class PostesModule {}
