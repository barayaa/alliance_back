import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateFournisseurDto {
  @IsString({})
  fournisseur: string;

  @IsString({})
  adresse: string;

  @IsString({})
  email: string;

}
