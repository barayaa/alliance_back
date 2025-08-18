import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateFabricantDto {
  @IsString({})
  fabricant: string;

}
