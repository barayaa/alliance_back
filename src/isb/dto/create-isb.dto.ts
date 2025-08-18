import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateIsbDto {
  @IsString({})
  isb: string;

  @IsString({})
  taux: string;

}
