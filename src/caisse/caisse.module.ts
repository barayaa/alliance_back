import { Module } from '@nestjs/common';
import { CaisseService } from './caisse.service';
import { CaisseController } from './caisse.controller';
import { Caisse } from './entities/caisse.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Caisse])],
  controllers: [CaisseController],
  providers: [CaisseService],
})
export class CaisseModule {}
