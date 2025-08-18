import { PartialType } from '@nestjs/mapped-types';
import { CreateDemandeAchatDto } from './create-demande_achat.dto';

export class UpdateDemandeAchatDto extends PartialType(CreateDemandeAchatDto) {}
