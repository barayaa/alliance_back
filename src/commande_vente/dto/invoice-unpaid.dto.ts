import { IsInt, IsDateString, IsOptional } from 'class-validator';

export class GetUnpaidInvoicesDto {
  @IsInt()
  id_client: number;

  @IsDateString()
  @IsOptional()
  date_debut?: string;

  @IsDateString()
  @IsOptional()
  date_fin?: string;
}
