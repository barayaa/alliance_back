import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateClientDto {
  @IsString({})
  nom: string;

  @IsString({})
  prenom: string;

  @IsString({})
  telephone: string;

  @IsString({})
  ville: string;

  @IsString({})
  adresse: string;

  @IsNumber({})
  compte: number;

  @IsString({})
  fax: string;

  @IsString({})
  email: string;

  @IsNumber({})
  cle_statut: number;

  @IsNumber({})
  solde: number;

  @IsString({})
  nif: string;

  @IsString({})
  login: string;

  @IsString({})
  password: string;

}
