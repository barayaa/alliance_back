import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleveFactures } from './releve_factures.entity';
import { ReleveFacturesService } from './releve_factures.service';
import { ReleveFacturesController } from './releve_factures.controller';
import { Client } from 'src/client/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReleveFactures, Client])],
  controllers: [ReleveFacturesController],
  providers: [ReleveFacturesService],
})
export class ReleveFacturesModule {}
