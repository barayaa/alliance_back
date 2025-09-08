import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateReclamationDto {
  @IsNumber({})
  cle_produit: number;

  @IsNumber({})
  quantite: number;

  @IsNumber({})
  prix_grossiste: number;

  @IsNumber({})
  numero_facture: number;

  @IsNumber({})
  date: Date;

  @IsNumber({})
  cle_nature_reclamation: number;
}
