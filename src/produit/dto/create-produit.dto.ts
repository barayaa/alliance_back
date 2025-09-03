import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateProduitDto {
  @IsString({})
  produit: string;

  @IsNumber({})
  cle_marque: number;

  @IsString({})
  denomination_commune_internationale: string;

  @IsNumber({})
  prix_vente: number;

  @IsString({})
  dosage: string;

  @IsNumber({})
  cle_forme: number;

  @IsString({})
  presentation: string;

  @IsNumber({})
  cle_voie_administration: number;

  @IsNumber({})
  cle_classe_therapeutique: number;

  @IsString({})
  n_amm: string;

  @IsString({})
  validite_amm: string;

  @IsNumber({})
  cle_statut_produit: number;

  @IsNumber({})
  pght: number;

  @IsNumber({})
  cle_titulaire_amm: number;

  @IsNumber({})
  cle_fabricant: number;

  @IsNumber({})
  prix_unitaire: number;

  @IsNumber({})
  stock_min: number;

  @IsDate({})
  stock_courant: any;

  @IsString({})
  group_tva: string;

  @IsString({})
  etiquette_tva: string;

  @IsNumber({})
  taux_tva: number;

  @IsNumber({})
  entree: number;

  @IsNumber({})
  sortie_fv: number;

  @IsNumber({})
  sortie_bs: number;

  @IsNumber({})
  avoir: number;

  @IsNumber({})
  amb_entree: number;

  @IsNumber({})
  amb_sortie: number;

  @IsNumber({})
  stock_courant_date: number;
}
