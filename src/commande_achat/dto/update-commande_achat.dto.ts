import { PartialType } from '@nestjs/mapped-types';
import { CreateCommandeAchatDto } from './create-commande_achat.dto';

export class UpdateCommandeAchatDto extends PartialType(CreateCommandeAchatDto) {}
