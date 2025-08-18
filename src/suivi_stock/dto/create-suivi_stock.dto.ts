import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateSuiviStockDto {
  @IsDate({})
  date_print: Date;

  @IsNumber({})
  id_produit: number;

  @IsNumber({})
  entree: number;

  @IsNumber({})
  sortie: number;

  @IsNumber({})
  stock: number;

}
