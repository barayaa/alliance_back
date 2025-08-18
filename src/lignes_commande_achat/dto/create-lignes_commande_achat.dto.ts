// import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

// export class CreateLignesCommandeAchatDto {
//   @IsNumber({})
//   id_commande_achat: number;

//   @IsNumber({})
//   designation: number;

//   @IsNumber()
//   pu?: number | null;

//   @IsNumber()
//   remise?: number | null;

//   @IsNumber({})
//   quantite: number;

//   @IsNumber()
//   montant?: number | null;

//   @IsNumber()
//   montant_tva?: number | null;

//   @IsDate({})
//   date: Date;

//   @IsNumber({})
//   qty_commandee: number;

//   @IsString({})
//   numero_lot: string;

//   @IsString({})
//   date_expiration: string;

//   @IsString({})
//   conformite: string;
// }
import {
  IsInt,
  IsNumber,
  IsString,
  IsOptional,
  IsDate,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLignesCommandeAchatDto {
  @IsInt()
  id_commande_achat: number;

  @IsInt()
  designation: number; // id_produit

  @IsNumber()
  quantite: number;

  @IsInt()
  @IsOptional()
  qty_commandee: number;

  @IsString()
  @IsOptional()
  numero_lot: string;

  @IsString()
  @IsOptional()
  date_expiration: string; // varchar(10) dans la table

  @IsString()
  @IsOptional()
  conformite: string;

  @IsNumber()
  @IsOptional()
  pu: number;

  @IsNumber()
  @IsOptional()
  montant: number;

  @IsNumber()
  @IsOptional()
  montant_tva: number;

  @IsNumber()
  @IsOptional()
  remise: number;

  @IsDateString()
  @Type(() => Date)
  date: Date;
}
