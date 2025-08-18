import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateNatureReclamationDto {
  @IsString({})
  nature_reclamation: string;

}
