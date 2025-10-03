// src/commande_vente/interfaces/supplier-stats.interface.ts
export interface ProductStats {
  id_produit: number;
  nom_produit: string;
  denomination: string;
  dosage: string;
  presentation: string;
  quantite_vendue: number;
  stock_courant: number;
  nombre_ventes: number;
}

export interface SupplierStats {
  id_fournisseur: number;
  nom_fournisseur: string;
  produits: ProductStats[];
  total_quantite_vendue: number;
  total_produits: number;
}
