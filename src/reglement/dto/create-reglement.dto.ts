import { IsString, IsNumber, IsDate, IsOptional, IsInt } from 'class-validator';

export class CreateReglementDto {
  @IsNumber({})
  id_client: number;

  @IsNumber({})
  montant: number;

  @IsString({})
  date: string;

  // @IsString({})
  // id_commande_vente: string;

  @IsInt({ message: 'id_type_reglement doit être un entier' })
  id_type_reglement: number;

  @IsInt({ message: 'id_caisse doit être un entier' })
  @IsOptional()
  id_caisse?: number;

  @IsInt({ message: 'id_compte doit être un entier' })
  @IsOptional()
  id_compte?: number;
}
