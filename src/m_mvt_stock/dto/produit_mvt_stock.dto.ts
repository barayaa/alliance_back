import {
  IsNumber,
  IsString,
  IsDateString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class ProduitMvtStockDto {
  @IsNumber()
  @IsNotEmpty()
  id_produit: number;

  @IsNumber()
  @IsNotEmpty()
  quantiteCommandee: number;

  @IsOptional()
  @IsString()
  conformite?: string;

  @IsNumber()
  @IsNotEmpty()
  quantiteRecue: number;

  @IsString()
  @IsNotEmpty()
  numLot: string;

  @IsDateString()
  @IsNotEmpty()
  dateExpiration: string;
}
