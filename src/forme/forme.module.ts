
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Forme } from './forme.entity';
import { FormeService } from './forme.service';
import { FormeController } from './forme.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Forme])],
  controllers: [FormeController],
  providers: [FormeService],
})
export class FormeModule {}
