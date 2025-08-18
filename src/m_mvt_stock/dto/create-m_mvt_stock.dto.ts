import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateMMvtStockDto {
  @IsNumber({})
  id_produit: number;

  @IsNumber()
  quantite?: number | null;

  @IsNumber({})
  cout: number;

  @IsDate({})
  date: Date;

  @IsString({})
  user: string;

  @IsNumber({})
  type: number;

  @IsNumber({})
  magasin: number;

  @IsString({})
  commentaire: string;

  @IsNumber({})
  stock_avant: number;

  @IsNumber({})
  stock_apres: number;

  @IsString({})
  id_commande_vente: string;

  @IsString({})
  annule: string;
}
