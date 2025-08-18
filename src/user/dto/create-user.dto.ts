import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString({})
  nom: string;

  @IsString({})
  prenom: string;

  @IsString({})
  login: string;

  @IsString({})
  password: string;

  @IsString({})
  email: string;

  @IsString({})
  telephone: string;

  @IsString({})
  poste?: string;

  @IsString({})
  role?: string;

  @IsNumber({})
  password_status?: number;

  @IsNumber({})
  profil?: number;

  @IsNumber({})
  id_fonction?: number;

  @IsNumber({})
  id_departement?: number;

  @IsNumber({})
  id_service?: number;

  @IsNumber({})
  id_direction?: number;
}
