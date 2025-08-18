import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateClasseTherapeutiqueDto {
  @IsString({})
  classe_therapeutique: string;

}
