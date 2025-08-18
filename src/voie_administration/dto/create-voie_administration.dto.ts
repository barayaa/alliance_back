import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateVoieAdministrationDto {
  @IsString({})
  voie_administration: string;

}
