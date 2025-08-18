
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoieAdministration } from './voie_administration.entity';
import { VoieAdministrationService } from './voie_administration.service';
import { VoieAdministrationController } from './voie_administration.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VoieAdministration])],
  controllers: [VoieAdministrationController],
  providers: [VoieAdministrationService],
})
export class VoieAdministrationModule {}
