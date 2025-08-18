
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conformite } from './conformite.entity';
import { ConformiteService } from './conformite.service';
import { ConformiteController } from './conformite.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Conformite])],
  controllers: [ConformiteController],
  providers: [ConformiteService],
})
export class ConformiteModule {}
