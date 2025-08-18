import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateTaxableDto {
  @IsString({})
  taxable: string;

}
