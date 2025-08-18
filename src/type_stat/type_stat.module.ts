
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeStat } from './type_stat.entity';
import { TypeStatService } from './type_stat.service';
import { TypeStatController } from './type_stat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TypeStat])],
  controllers: [TypeStatController],
  providers: [TypeStatService],
})
export class TypeStatModule {}
