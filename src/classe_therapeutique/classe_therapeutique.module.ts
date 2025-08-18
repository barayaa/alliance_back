
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClasseTherapeutique } from './classe_therapeutique.entity';
import { ClasseTherapeutiqueService } from './classe_therapeutique.service';
import { ClasseTherapeutiqueController } from './classe_therapeutique.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClasseTherapeutique])],
  controllers: [ClasseTherapeutiqueController],
  providers: [ClasseTherapeutiqueService],
})
export class ClasseTherapeutiqueModule {}
