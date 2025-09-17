import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsEmpty,
} from 'class-validator';
import { CreateLignesCommandeVenteDto } from 'src/lignes_commande_vente/dto/create-lignes_commande_vente.dto';

export class CreateCommandeVenteDto {
  @IsNumber()
  id_commande_vente: number;

  @IsDateString()
  @IsNotEmpty()
  date_commande_vente: string;

  @IsNumber()
  @IsNotEmpty()
  id_client: number;

  @IsNumber()
  @IsNotEmpty()
  remise: number;

  @IsString()
  @IsEmpty()
  type_isb?: any;

  @IsArray()
  @IsNotEmpty()
  lignes: CreateLignesCommandeVenteDto[];

  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsOptional()
  client_vd?: string | null;

  @IsNumber()
  @IsOptional()
  tva?: number;

  @IsString()
  @IsOptional()
  nif_vd?: string | null;

  @IsString()
  @IsOptional()
  adresse_vd?: string | null;

  @IsString()
  @IsOptional()
  telephone_vd?: string | null;

  @IsString()
  @IsOptional()
  email_vd?: string | null;

  @IsString()
  @IsOptional()
  ville_vd?: string | null;

  @IsString()
  @IsOptional()
  commentaire1?: string | null;

  @IsString()
  @IsOptional()
  commentaire2?: string | null;

  @IsString()
  @IsOptional()
  commentaire3?: string | null;

  @IsString()
  @IsOptional()
  commentaire4?: string | null;

  @IsString()
  @IsOptional()
  commentaire5?: string | null;

  @IsString()
  @IsOptional()
  commentaire6?: string | null;

  @IsString()
  @IsOptional()
  commentaire7?: string | null;

  @IsString()
  @IsOptional()
  commentaire8?: string | null;

  @IsString()
  @IsNotEmpty()
  type_reglement: string;

  @IsString()
  @IsNotEmpty()
  numero_facture_certifiee: string;
}
