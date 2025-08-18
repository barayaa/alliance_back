
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepMcf } from './rep_mcf.entity';
import { RepMcfService } from './rep_mcf.service';
import { RepMcfController } from './rep_mcf.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RepMcf])],
  controllers: [RepMcfController],
  providers: [RepMcfService],
})
export class RepMcfModule {}
