import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateTitulaireAmmDto {
  @IsString({})
  titulaire_amm: string;

}
