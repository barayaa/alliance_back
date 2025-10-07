// // src/depenses/dto/create-depense.dto.ts
// import {
//   IsNumber,
//   IsString,
//   IsOptional,
//   ValidateIf,
//   IsInt,
// } from 'class-validator';

// export class CreateDepenseDto {
//   @IsNumber()
//   montant: number;

//   @IsString()
//   date: string;

//   @IsOptional()
//   @IsString()
//   description?: string;

//   @IsInt({ message: 'id_type_reglement doit être un entier' })
//   id_type_reglement: number;

//   @ValidateIf((o) => o.id_caisse === undefined)
//   @IsNumber()
//   id_compte?: number;

//   @ValidateIf((o) => o.id_compte === undefined)
//   @IsNumber()
//   id_caisse?: number;
// }

// src/depenses/dto/create-depense.dto.ts
import { IsNumber, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateDepenseDto {
  @IsNumber()
  montant: number;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt({ message: 'id_type_reglement doit être un entier' })
  id_type_reglement: number;

  @IsOptional()
  @IsInt()
  id_compte?: number;

  @IsOptional()
  @IsInt()
  id_caisse?: number;

  @IsInt()
  @IsOptional()
  id_nita?: number;
}
