import { Module } from '@nestjs/common';
import { MouvementNitaService } from './mouvement_nita.service';
import { MouvementNitaController } from './mouvement_nita.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MouvementNita } from './entities/mouvement_nita.entity';
import { Nita } from 'src/nita/entities/nita.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MouvementNita, Nita])],
  controllers: [MouvementNitaController],
  providers: [MouvementNitaService],
})
export class MouvementNitaModule {}
