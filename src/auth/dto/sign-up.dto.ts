import { IsEmail, IsNumber, IsString, MinLength } from 'class-validator';
import { Role } from 'src/user/enums/role.enum';

export class SignupDto {
  @IsString()
  nom: string;
  @IsString()
  prenom: string;
  @IsEmail()
  email: string;
  @IsString()
  telephone: string;
  @IsString({})
  login: string;
  @IsString()
  poste: string;
  @IsString()
  role: Role;
  @IsString()
  departement: string;
  @MinLength(6)
  password: string;
  @IsNumber()
  password_status: number;
  @IsNumber()
  id_fonction: number | null;
  @IsNumber()
  id_departement: number | null;
  @IsNumber()
  id_service: number | null;
  @IsNumber()
  id_direction: number | null;
}
