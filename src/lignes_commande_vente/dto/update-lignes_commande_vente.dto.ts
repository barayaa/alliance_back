import { PartialType } from '@nestjs/mapped-types';
import { CreateLignesCommandeVenteDto } from './create-lignes_commande_vente.dto';

export class UpdateLignesCommandeVenteDto extends PartialType(CreateLignesCommandeVenteDto) {}
