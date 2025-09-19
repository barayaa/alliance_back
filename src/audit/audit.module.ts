import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audit } from './entities/audit.entity';
import { Produit } from 'src/produit/produit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Audit, Produit])],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
