import { PartialType } from '@nestjs/mapped-types';
import { CreateClasseTherapeutiqueDto } from './create-classe_therapeutique.dto';

export class UpdateClasseTherapeutiqueDto extends PartialType(CreateClasseTherapeutiqueDto) {}
