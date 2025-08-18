import { PartialType } from '@nestjs/mapped-types';
import { CreateLignesDemandeAchatDto } from './create-lignes_demande_achat.dto';

export class UpdateLignesDemandeAchatDto extends PartialType(CreateLignesDemandeAchatDto) {}
