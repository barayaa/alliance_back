import { Injectable } from '@nestjs/common';
import { CreateAuditDto } from './dto/create-audit.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { Audit } from './entities/audit.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(Audit)
    private audtRepository: Repository<Audit>,
  ) {}
  create(createAuditDto: CreateAuditDto) {
    return 'This action adds a new audit';
  }

  findAll() {
    return this.audtRepository.find({
      relations: {
        produit: true,
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} audit`;
  }

  update(id: number, updateAuditDto: UpdateAuditDto) {
    return `This action updates a #${id} audit`;
  }

  remove(id: number) {
    return `This action removes a #${id} audit`;
  }
}
