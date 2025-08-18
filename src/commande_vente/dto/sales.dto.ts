import { IsString, IsNumber, IsDate } from 'class-validator';

export class SaleDto {
  @IsNumber()
  id_commande_vente: number;

  @IsDate()
  date_commande_vente: Date;

  @IsString()
  nom_client: string;

  @IsString()
  nom_produit: string;

  @IsNumber()
  quantite: number;

  @IsNumber()
  prix_unitaire: number;

  @IsNumber()
  montant_ligne: number;

  @IsNumber()
  montant_commande: number;
}
