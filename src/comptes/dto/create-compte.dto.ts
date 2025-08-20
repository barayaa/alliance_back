import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateCompteDto {
  @IsString({ message: 'numero_compte doit être une chaîne de caractères' })
  numero_compte: string;

  @IsNumber({}, { message: 'id_banque doit être un nombre' })
  id_banque: number;

  @IsPositive({ message: 'solde doit être un nombre positif ou zéro' })
  solde: number;

  @IsDateString({}, { message: 'date_creation doit être au format YYYY-MM-DD' })
  date_creation: string;

  @IsDateString(
    {},
    { message: 'date_fermeture doit être au format YYYY-MM-DD' },
  )
  @IsOptional()
  date_fermeture?: string;
}
