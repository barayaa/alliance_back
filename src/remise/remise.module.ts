
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Remise } from './remise.entity';
import { RemiseService } from './remise.service';
import { RemiseController } from './remise.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Remise])],
  controllers: [RemiseController],
  providers: [RemiseService],
})
export class RemiseModule {}
