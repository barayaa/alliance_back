
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoyenReglement } from './moyen_reglement.entity';
import { MoyenReglementService } from './moyen_reglement.service';
import { MoyenReglementController } from './moyen_reglement.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MoyenReglement])],
  controllers: [MoyenReglementController],
  providers: [MoyenReglementService],
})
export class MoyenReglementModule {}
