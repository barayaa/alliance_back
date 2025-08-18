import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateTypeMvtDto {
  @IsString({})
  type_mvt: string;

}
