import { IsInt, IsOptional, IsString } from 'class-validator';

export class GetAvoirsDto {
  @IsInt()
  id_client: number;

  @IsOptional()
  @IsString()
  date_debut?: string;

  @IsOptional()
  @IsString()
  date_fin?: string;
}
