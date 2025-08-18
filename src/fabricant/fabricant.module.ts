
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fabricant } from './fabricant.entity';
import { FabricantService } from './fabricant.service';
import { FabricantController } from './fabricant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Fabricant])],
  controllers: [FabricantController],
  providers: [FabricantService],
})
export class FabricantModule {}
