import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateMarqueDto {
  @IsString({})
  marque: string;

}
