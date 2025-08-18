
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NatureReclamation } from './nature_reclamation.entity';
import { NatureReclamationService } from './nature_reclamation.service';
import { NatureReclamationController } from './nature_reclamation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NatureReclamation])],
  controllers: [NatureReclamationController],
  providers: [NatureReclamationService],
})
export class NatureReclamationModule {}
