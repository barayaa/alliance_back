import { PartialType } from '@nestjs/mapped-types';
import { CreateLigneAvoirDto } from './create-ligne_avoir.dto';

export class UpdateLigneAvoirDto extends PartialType(CreateLigneAvoirDto) {}
