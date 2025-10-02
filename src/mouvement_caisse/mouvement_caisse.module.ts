import { Module } from '@nestjs/common';
import { MouvementCaisseService } from './mouvement_caisse.service';
import { MouvementCaisseController } from './mouvement_caisse.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MouvementCaisse } from './entities/mouvement_caisse.entity';
import { Reglement } from 'src/reglement/reglement.entity';

@Module({
  imports: [
    // Ajoutez ici les modules nécessaires, par exemple TypeOrmModule.forFeature([...])
    TypeOrmModule.forFeature([MouvementCaisse, Reglement]),
  ],
  controllers: [MouvementCaisseController],
  providers: [MouvementCaisseService],
})
export class MouvementCaisseModule {}
