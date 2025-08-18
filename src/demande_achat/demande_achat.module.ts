
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemandeAchat } from './demande_achat.entity';
import { DemandeAchatService } from './demande_achat.service';
import { DemandeAchatController } from './demande_achat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DemandeAchat])],
  controllers: [DemandeAchatController],
  providers: [DemandeAchatService],
})
export class DemandeAchatModule {}
