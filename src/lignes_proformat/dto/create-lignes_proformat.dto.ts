import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateLignesProformatDto {
  @IsString({})
  id_commande_vente: string;

  @IsNumber({})
  designation: number;

  @IsNumber({})
  prix_vente: number;

  @IsNumber({})
  remise: number;

  @IsString()
  description_remise?: string | null;

  @IsString({})
  prix_vente_avant_remise: string;

  @IsNumber({})
  quantite: number;

  @IsNumber({})
  montant: number;

  @IsString({})
  group_tva: string;

  @IsString({})
  etiquette_tva: string;

  @IsNumber({})
  taux_tva: number;

  @IsNumber({})
  montant_tva: number;

  @IsNumber({})
  isb_ligne: number;

  @IsString({})
  date: string;

  @IsNumber({})
  stock_avant: number;

  @IsDate({})
  stock_apres: any;

  @IsNumber({})
  retour: number;

  @IsNumber({})
  statut_proformat: number;
}
