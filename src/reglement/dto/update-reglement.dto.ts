import { PartialType } from '@nestjs/mapped-types';
import { CreateReglementDto } from './create-reglement.dto';

export class UpdateReglementDto extends PartialType(CreateReglementDto) {}
