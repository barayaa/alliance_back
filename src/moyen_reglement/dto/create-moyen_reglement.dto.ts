import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateMoyenReglementDto {
  @IsString({})
  moyen: string;

}
