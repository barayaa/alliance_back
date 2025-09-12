import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: {
        posteEntity: true,
      },
    });
  }

  async findOne(id: number): Promise<User> {
    const entity = await this.userRepository.findOne({
      where: { id_user: id },
    });
    if (!entity) throw new NotFoundException('User not found');
    return entity;
  }

  // async create(dto: CreateUserDto): Promise<User> {
  //   const entity = this.userRepository.create(dto);
  //   return this.userRepository.save(entity);
  // }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.userRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.userRepository.remove(entity);
  }
}
