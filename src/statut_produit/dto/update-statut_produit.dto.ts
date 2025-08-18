import { PartialType } from '@nestjs/mapped-types';
import { CreateStatutProduitDto } from './create-statut_produit.dto';

export class UpdateStatutProduitDto extends PartialType(CreateStatutProduitDto) {}
