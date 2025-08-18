
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FicheVisite } from './fiche_visite.entity';
import { FicheVisiteService } from './fiche_visite.service';
import { FicheVisiteController } from './fiche_visite.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FicheVisite])],
  controllers: [FicheVisiteController],
  providers: [FicheVisiteService],
})
export class FicheVisiteModule {}
