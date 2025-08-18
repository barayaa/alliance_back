
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntreesDeleted } from './entrees_deleted.entity';
import { EntreesDeletedService } from './entrees_deleted.service';
import { EntreesDeletedController } from './entrees_deleted.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EntreesDeleted])],
  controllers: [EntreesDeletedController],
  providers: [EntreesDeletedService],
})
export class EntreesDeletedModule {}
