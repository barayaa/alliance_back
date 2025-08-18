import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateEntreesDeletedDto {
  @IsNumber({})
  id_entrees_deleted: number;

  @IsString({})
  date: string;

  @IsString({})
  user: string;

}
