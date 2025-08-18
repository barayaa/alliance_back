import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateTypeStatDto {
  @IsString({})
  type_stat: string;

}
