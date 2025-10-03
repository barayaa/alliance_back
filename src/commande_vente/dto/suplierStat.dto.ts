import { IsDateString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetSupplierStatsDto {
  @IsDateString()
  date_debut: string;

  @IsDateString()
  date_fin: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_fournisseur?: number;
}
