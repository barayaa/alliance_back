
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LignesDemandeAchat } from './lignes_demande_achat.entity';
import { LignesDemandeAchatService } from './lignes_demande_achat.service';
import { LignesDemandeAchatController } from './lignes_demande_achat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LignesDemandeAchat])],
  controllers: [LignesDemandeAchatController],
  providers: [LignesDemandeAchatService],
})
export class LignesDemandeAchatModule {}
