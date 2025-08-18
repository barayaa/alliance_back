import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateLignesDemandeAchatDto {
  @IsNumber({})
  id_mp: number;

  @IsNumber({})
  id_produit: number;

  @IsNumber({})
  quantite: number;

  @IsNumber({})
  prix_unitaire: number;

  @IsNumber({})
  montant_ligne: number;

  @IsNumber({})
  id_variete: number;

  @IsNumber({})
  id_demande_achat: number;

  @IsString({})
  date: string;

  @IsNumber({})
  statut: number;

}
