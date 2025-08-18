import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateTaxGroupDto {
  @IsString({})
  tax_group: string;

  @IsString({})
  etiquette: string;

  @IsString({})
  taux: string;

  @IsString({})
  description: string;

  @IsString({})
  observation: string;

}
