import { PartialType } from '@nestjs/mapped-types';
import { CreateMouvementNitaDto } from './create-mouvement_nita.dto';

export class UpdateMouvementNitaDto extends PartialType(CreateMouvementNitaDto) {}
