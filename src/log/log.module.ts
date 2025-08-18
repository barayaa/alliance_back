import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './log.entity';
import { LogService } from './log.service';
import { LogController } from './log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Log])],
  exports: [TypeOrmModule], // Export TypeOrmModule to make LogRepository available
  controllers: [LogController],
  providers: [LogService],
})
export class LogModule {}
