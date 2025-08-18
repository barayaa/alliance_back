
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LignesProformat } from './lignes_proformat.entity';
import { LignesProformatService } from './lignes_proformat.service';
import { LignesProformatController } from './lignes_proformat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LignesProformat])],
  controllers: [LignesProformatController],
  providers: [LignesProformatService],
})
export class LignesProformatModule {}
