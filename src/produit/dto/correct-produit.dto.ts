export class CorrectStockDto {
  new_stock: number; // Stock physique réel après audit
  description: string; // Ex. "Correction après audit physique : surplus détecté"
  user_id: number; // ID de l'utilisateur
  user_nom: string; // Nom de l'utilisateur
}
