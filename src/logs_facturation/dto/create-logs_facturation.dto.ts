import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateLogsFacturationDto {
  @IsNumber({})
  id_commande_vente: number;

  @IsDate({})
  date_commande_vente: Date;

  @IsNumber({})
  montant_total: number;

  @IsNumber({})
  montant_paye: number;

  @IsNumber({})
  montant_restant: number;

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

  @IsString()
  client_vd?: string | null;

  @IsString()
  nif_vd?: string | null;

  @IsString()
  adresse_vd?: string | null;

  @IsString()
  telephone_vd?: string | null;

  @IsString()
  email_vd?: string | null;

  @IsString()
  ville_vd?: string | null;

  @IsString()
  commentaire1?: string | null;

  @IsString()
  commentaire2?: string | null;

  @IsString()
  commentaire3?: string | null;

  @IsString()
  commentaire4?: string | null;

  @IsString()
  commentaire5?: string | null;

  @IsString()
  commentaire6?: string | null;

  @IsString()
  commentaire7?: string | null;

  @IsString()
  commentaire8?: string | null;

  @IsString({})
  certifiee: string;

  @IsString()
  counter_per_receipt_type?: string | null;

  @IsString()
  total_receipt_counter?: string | null;

  @IsString()
  receipt_type?: string | null;

  @IsString()
  process_date_and_time?: string | null;

  @IsString()
  device_dentification?: string | null;

  @IsString()
  nif_?: string | null;

  @IsString()
  signature?: string | null;

  @IsString()
  ref_ini?: string | null;

  @IsString()
  exoneration?: string | null;
}
