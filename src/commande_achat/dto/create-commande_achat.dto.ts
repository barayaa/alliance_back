import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLignesCommandeAchatDto } from 'src/lignes_commande_achat/dto/create-lignes_commande_achat.dto';
export class CreateCommandeAchatDto {
  @IsDateString()
  date_commande_achat: string;

  @IsString()
  reference: string;

  @IsNumber()
  id_fournisseur: number;

  @IsNumber()
  id_destination: number;

  @IsNumber()
  @Type(() => Number) // Convert string to number
  moyen_reglement?: number;

  @IsNumber()
  @Type(() => Number) // Convert string to number
  type_reglement?: number;

  @IsArray()
  @Type(() => CreateLignesCommandeAchatDto)
  produits: CreateLignesCommandeAchatDto[];

  @IsNumber()
  @IsOptional()
  montant_paye?: number;

  @IsNumber()
  @IsOptional()
  validee?: number;

  @IsNumber()
  @IsOptional()
  statut?: number;

  @IsNumber()
  @IsOptional()
  reglee?: number;

  @IsNumber()
  @IsOptional()
  tva?: number;

  @IsNumber()
  @IsOptional()
  avoir?: number;
}

// @IsDateString()
// @IsNotEmpty()
// date_commande_achat: string;

// @IsNumber()
// @IsOptional()
// montant_total: number;

// @IsNumber()
// @IsOptional()
// montant_paye: number;

// @IsNumber()
// @IsOptional()
// montant_restant: number;

// @IsNumber()
// @IsOptional()
// validee: number;

// @IsNumber()
// @IsOptional()
// statut: number;

// @IsNumber()
// @Min(1)
// @IsNotEmpty()
// id_fournisseur: number;

// @IsNumber()
// @IsOptional()
// reglee: number;

// @IsNumber()
// @IsNotEmpty()
// moyen_reglement: number;

// @IsNumber()
// @IsNotEmpty()
// type_reglement: number;

// @IsNumber()
// @IsOptional()
// tva: number;

// @IsNumber()
// @IsOptional()
// avoir: number;

// @IsString()
// @IsNotEmpty()
// reference: string;

// @IsNumber()
// @Min(1)
// @IsNotEmpty()
// id_destination: number;

// @IsArray()
// @ValidateNested({ each: true })
// @Type(() => CreateLignesCommandeAchatDto)
// @IsNotEmpty()
// produits: CreateLignesCommandeAchatDto[];
