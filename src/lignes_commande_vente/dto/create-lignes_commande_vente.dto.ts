import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsNotEmpty,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateLignesCommandeVenteDto {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  id_produit: number;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantite: number;

  @IsNumber()
  @IsNotEmpty()
  prix_vente: number;

  @IsNumber()
  @IsNotEmpty()
  remise: number;

  @IsString()
  @IsNotEmpty()
  description_remise: string;

  @IsString()
  @IsNotEmpty()
  prix_vente_avant_remise: string;

  @IsString()
  @IsNotEmpty()
  group_tva: string;

  @IsString()
  @IsNotEmpty()
  etiquette_tva: string;

  @IsNumber()
  @IsNotEmpty()
  taux_tva: number;

  @IsNumber()
  @IsNotEmpty()
  isb_ligne: number;

  @IsString()
  @IsNotEmpty()
  date: string;

  // @IsNumber()
  // @IsNotEmpty()
  // id_commande_vente: number;
}
