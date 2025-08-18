import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateTypeReglementDto {
  @IsString({})
  type_reglement: string;

}
