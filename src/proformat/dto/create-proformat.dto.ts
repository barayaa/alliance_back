import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLignesProformatDto } from 'src/lignes_proformat/dto/create-lignes_proformat.dto';

export class CreateProformatDto {
  @IsDate({})
  date_commande_vente: Date;

  @IsNumber({})
  montant_total: number;

  @IsNumber({})
  montant_paye: number;

  @IsNumber({})
  montant_restant: number;

  @IsNumber({})
  @IsOptional()
  remise?: number | null;

  @IsNumber({})
  validee: number;

  @IsNumber({})
  statut: number;

  @IsNumber({})
  id_client: number;

  @IsNumber({})
  reglee: number;

  @IsNumber({})
  moyen_reglement: number;

  @IsString({})
  type_reglement: string;

  @IsNumber({})
  tva: number;

  @IsString({})
  type_isb: string;

  @IsNumber({})
  isb: number;

  @IsNumber({})
  avoir: number;

  @IsString({})
  login: string;

  @IsString({})
  type_facture: string;

  @IsString({})
  reponse_mcf: string;

  @IsString({})
  qrcode: string;

  @IsString({})
  @IsOptional()
  client_vd?: string | null;

  @IsString({})
  @IsOptional()
  nif_vd?: string | null;

  @IsString({})
  @IsOptional()
  adresse_vd?: string | null;

  @IsString({})
  @IsOptional()
  telephone_vd?: string | null;

  @IsString({})
  @IsOptional()
  email_vd?: string | null;

  @IsString({})
  @IsOptional()
  ville_vd?: string | null;

  @IsString({})
  @IsOptional()
  commentaire1?: string | null;

  @IsString({})
  @IsOptional()
  commentaire2?: string | null;

  @IsString({})
  @IsOptional()
  commentaire3?: string | null;

  @IsString({})
  @IsOptional()
  commentaire4?: string | null;

  @IsString({})
  @IsOptional()
  commentaire5?: string | null;

  @IsString({})
  @IsOptional()
  commentaire6?: string | null;

  @IsString({})
  @IsOptional()
  commentaire7?: string | null;

  @IsString({})
  @IsOptional()
  commentaire8?: string | null;

  @IsString({})
  certifiee: string;

  @IsString({})
  @IsOptional()
  counter_per_receipt_type?: string | null;

  @IsString({})
  @IsOptional()
  total_receipt_counter?: string | null;

  @IsString({})
  @IsOptional()
  receipt_type?: string | null;

  @IsString({})
  @IsOptional()
  process_date_and_time?: string | null;

  @IsString({})
  @IsOptional()
  device_dentification?: string | null;

  @IsString({})
  @IsOptional()
  nif_?: string | null;

  @IsString({})
  @IsOptional()
  signature?: string | null;

  @IsString({})
  @IsOptional()
  ref_ini?: string | null;

  @IsString({})
  @IsOptional()
  exoneration?: string | null;

  @IsNumber({})
  numero_seq: number;

  @IsString({})
  numero_facture_certifiee: string;

  @IsNumber({})
  imprimee: number;

  @IsNumber({})
  statut_proformat: number;

  @IsString({})
  facture_definitive: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLignesProformatDto)
  lignes: CreateLignesProformatDto[];
}
