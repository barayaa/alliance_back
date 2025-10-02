import { PartialType } from '@nestjs/mapped-types';
import { CreateMouvementCaisseDto } from './create-mouvement_caisse.dto';

export class UpdateMouvementCaisseDto extends PartialType(CreateMouvementCaisseDto) {}
