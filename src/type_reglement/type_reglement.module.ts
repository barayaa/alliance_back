
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeReglement } from './type_reglement.entity';
import { TypeReglementService } from './type_reglement.service';
import { TypeReglementController } from './type_reglement.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TypeReglement])],
  controllers: [TypeReglementController],
  providers: [TypeReglementService],
})
export class TypeReglementModule {}
