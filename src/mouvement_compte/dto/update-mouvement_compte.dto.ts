import { PartialType } from '@nestjs/mapped-types';
import { CreateMouvementCompteDto } from './create-mouvement_compte.dto';

export class UpdateMouvementCompteDto extends PartialType(CreateMouvementCompteDto) {}
