import { PartialType } from '@nestjs/mapped-types';
import { CreateStatutDto } from './create-statut.dto';

export class UpdateStatutDto extends PartialType(CreateStatutDto) {}
