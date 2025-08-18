import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateDemandeAchatDto {
  @IsString({})
  date: string;

  @IsString({})
  user: string;

  @IsNumber({})
  cloture: number;

  @IsNumber({})
  type_doc: number;

  @IsNumber({})
  niveau: number;

  @IsNumber({})
  statut: number;

  @IsString({})
  commentaire_rejet: string;

  @IsNumber({})
  valide: number;

  @IsString({})
  commentaire: string;

  @IsNumber({})
  sortie_conforme: number;

  @IsString({})
  demandeur: string;

  @IsNumber({})
  montant_total: number;

  @IsNumber({})
  id_fournisseur: number;

}
