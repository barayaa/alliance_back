import {
  IsNumber,
  IsString,
  IsDateString,
  IsArray,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProduitMvtStockDto } from './produit_mvt_stock.dto';

export class CreateEntreeStockDto {
  @IsNumber()
  @IsNotEmpty()
  fournisseurId: number;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsNotEmpty()
  referenceCommande: string;

  @IsDateString()
  @IsNotEmpty()
  dateMouvement: string;

  @IsNotEmpty()
  @IsNumber()
  user: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProduitMvtStockDto)
  produits: ProduitMvtStockDto[];
}
