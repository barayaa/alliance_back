import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateStatutDto {
  @IsString({})
  statut: string;

}
