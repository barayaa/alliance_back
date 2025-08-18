import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeReglementDto } from './create-type_reglement.dto';

export class UpdateTypeReglementDto extends PartialType(CreateTypeReglementDto) {}
