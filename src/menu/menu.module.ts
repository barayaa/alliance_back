import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from './entities/menu.entity';
import { Poste } from 'src/postes/entities/poste.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, Poste])],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
