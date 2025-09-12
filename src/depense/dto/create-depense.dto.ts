// src/depenses/dto/create-depense.dto.ts
import { IsNumber, IsString, IsOptional, ValidateIf } from 'class-validator';

export class CreateDepenseDto {
  @IsNumber()
  montant: number;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateIf((o) => o.id_caisse === undefined)
  @IsNumber()
  id_compte?: number;

  @ValidateIf((o) => o.id_compte === undefined)
  @IsNumber()
  id_caisse?: number;
}
