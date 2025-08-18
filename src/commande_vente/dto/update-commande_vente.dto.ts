import { PartialType } from '@nestjs/mapped-types';
import { CreateCommandeVenteDto } from './create-commande_vente.dto';

export class UpdateCommandeVenteDto extends PartialType(CreateCommandeVenteDto) {}
