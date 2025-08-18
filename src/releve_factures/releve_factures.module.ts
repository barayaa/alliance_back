
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleveFactures } from './releve_factures.entity';
import { ReleveFacturesService } from './releve_factures.service';
import { ReleveFacturesController } from './releve_factures.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReleveFactures])],
  controllers: [ReleveFacturesController],
  providers: [ReleveFacturesService],
})
export class ReleveFacturesModule {}
