import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateRepMcfDto {
  @IsString({})
  counter_per_recommcoceipt_type: string;

  @IsString({})
  total_receipt_counter: string;

  @IsString({})
  receipt_type: string;

  @IsString({})
  process_date_and_time: string;

  @IsString({})
  device_dentification: string;

  @IsString({})
  nif_mcf: string;

  @IsString({})
  signature: string;

  @IsNumber({})
  id_commande_vente: number;

}
