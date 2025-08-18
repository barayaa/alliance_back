import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateReglementDto {
  @IsNumber({})
  id_client: number;

  @IsNumber({})
  montant: number;

  @IsString({})
  date: string;

  @IsString({})
  id_commande_vente: string;

}
