import { Module } from '@nestjs/common';
import { PostesService } from './postes.service';
import { PostesController } from './postes.controller';

@Module({
  controllers: [PostesController],
  providers: [PostesService],
})
export class PostesModule {}
