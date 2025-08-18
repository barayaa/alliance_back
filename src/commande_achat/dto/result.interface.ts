interface StockConsistency {
  id_produit: number;
  nom_produit: string;
  stock_courant: number;
  total_achats: number;
  total_ventes: number;
  stock_calcule: number;
  difference: number;
  error?: string; // Pour signaler les anomalies
}
