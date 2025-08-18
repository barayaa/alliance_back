import { PartialType } from '@nestjs/mapped-types';
import { CreateLignesCommandeAchatDto } from './create-lignes_commande_achat.dto';

export class UpdateLignesCommandeAchatDto extends PartialType(CreateLignesCommandeAchatDto) {}
