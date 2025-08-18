import { PartialType } from '@nestjs/mapped-types';
import { CreateMoyenReglementDto } from './create-moyen_reglement.dto';

export class UpdateMoyenReglementDto extends PartialType(CreateMoyenReglementDto) {}
