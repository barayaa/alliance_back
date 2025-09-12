import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Poste } from 'src/postes/entities/poste.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Poste])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
