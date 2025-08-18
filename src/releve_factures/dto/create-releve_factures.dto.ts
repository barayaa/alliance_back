import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateReleveFacturesDto {
  @IsNumber({})
  id_client: number;

  @IsString({})
  numeros_factures: string;

  @IsDate({})
  date_emission: Date;

  @IsDate({})
  dernier_delai: Date;

  @IsString({})
  statut: string;

}
