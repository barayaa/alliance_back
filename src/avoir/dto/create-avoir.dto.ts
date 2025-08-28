export class CreateAvoirDto {
  id_facture_vente: number;
  id_client: number;
  date_avoir?: string;
  remise?: number;
  type_isb: string;
  login: string;
  type_reglement?: string;
  client_vd?: string;
  nif_vd?: string;
  adresse_vd?: string;
  telephone_vd?: string;
  email_vd?: string;
  ville_vd?: string;
  commentaire1?: string;
  commentaire2?: string;
  commentaire3?: string;
  commentaire4?: string;
  commentaire5?: string;
  commentaire6?: string;
  commentaire7?: string;
  commentaire8?: string;
  lignes: {
    id_produit: number;
    quantite: number;
    remise?: number;
    description_remise?: string;
    isb_ligne?: number;
  }[];
}
