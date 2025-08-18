
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Marque } from './marque.entity';
import { MarqueService } from './marque.service';
import { MarqueController } from './marque.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Marque])],
  controllers: [MarqueController],
  providers: [MarqueService],
})
export class MarqueModule {}
