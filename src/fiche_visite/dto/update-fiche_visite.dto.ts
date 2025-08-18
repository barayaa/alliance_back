import { PartialType } from '@nestjs/mapped-types';
import { CreateFicheVisiteDto } from './create-fiche_visite.dto';

export class UpdateFicheVisiteDto extends PartialType(CreateFicheVisiteDto) {}
