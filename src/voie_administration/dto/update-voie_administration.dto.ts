import { PartialType } from '@nestjs/mapped-types';
import { CreateVoieAdministrationDto } from './create-voie_administration.dto';

export class UpdateVoieAdministrationDto extends PartialType(CreateVoieAdministrationDto) {}
