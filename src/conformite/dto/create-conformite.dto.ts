import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateConformiteDto {
  @IsString({})
  conformite: string;

}
