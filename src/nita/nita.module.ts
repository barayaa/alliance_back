import { Module } from '@nestjs/common';
import { NitaService } from './nita.service';
import { NitaController } from './nita.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nita } from './entities/nita.entity';
import { Depense } from 'src/depense/entities/depense.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Nita, Depense])],
  controllers: [NitaController],
  providers: [NitaService],
})
export class NitaModule {}
