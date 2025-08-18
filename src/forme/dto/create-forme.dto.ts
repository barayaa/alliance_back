import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateFormeDto {
  @IsString({})
  forme: string;

}
