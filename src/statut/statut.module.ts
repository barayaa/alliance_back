
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Statut } from './statut.entity';
import { StatutService } from './statut.service';
import { StatutController } from './statut.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Statut])],
  controllers: [StatutController],
  providers: [StatutService],
})
export class StatutModule {}
