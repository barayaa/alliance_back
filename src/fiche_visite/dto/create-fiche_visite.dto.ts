import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateFicheVisiteDto {
  @IsString({})
  nom_prenom_visiteur: string;

  @IsString({})
  personne_visitee: string;

  @IsString({})
  fonction: string;

  @IsString({})
  numero_telephone: string;

  @IsString({})
  objectifs_visite: string;

  @IsString({})
  produits_abordes: string;

  @IsString({})
  actions_realises: string;

  @IsString({})
  besoins_ou_remarques_des_clients: string;

  @IsString({})
  prochaine_etape: string;

  @IsString({})
  commentaires: string;

  @IsString({})
  aut_utilisateur: string;

}
