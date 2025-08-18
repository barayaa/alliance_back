import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateRemiseDto {
  @IsNumber({})
  remise: number;

  @IsString({})
  description: string;

}
