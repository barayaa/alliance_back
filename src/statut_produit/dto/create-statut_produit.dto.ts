import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateStatutProduitDto {
  @IsString({})
  statut_produit: string;

}
