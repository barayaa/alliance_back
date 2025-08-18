
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsFacturation } from './logs_facturation.entity';
import { LogsFacturationService } from './logs_facturation.service';
import { LogsFacturationController } from './logs_facturation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LogsFacturation])],
  controllers: [LogsFacturationController],
  providers: [LogsFacturationService],
})
export class LogsFacturationModule {}
