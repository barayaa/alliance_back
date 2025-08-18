import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Produit } from '../produit/produit.entity';
import { CommandeVente } from '../commande_vente/commande_vente.entity';

@Entity('lignes_commande_vente')
export class LignesCommandeVente {
  @PrimaryGeneratedColumn()
  id_ligne_commande_vente: number;

  @Column({ type: 'int' })
  id_commande_vente: number;

  @Column({ type: 'int' })
  designation: number;

  @Column({ type: 'double' })
  prix_vente: number;

  @Column({ type: 'double' })
  remise: number;

  @Column({ type: 'varchar' })
  description_remise: string;

  @Column({ type: 'varchar', length: 30 })
  prix_vente_avant_remise: string;

  @Column({ type: 'double' })
  quantite: number;

  @Column({ type: 'double' })
  montant: number;

  @Column({ type: 'varchar', length: 10 })
  group_tva: string;

  @Column({ type: 'varchar', length: 5 })
  etiquette_tva: string;

  @Column({ type: 'double' })
  taux_tva: number;

  @Column({ type: 'double' })
  montant_tva: number;

  @Column({ type: 'double' })
  isb_ligne: number;

  @Column({ type: 'varchar', length: 15 })
  date: string;

  @Column({ type: 'double' })
  stock_avant: number;

  @Column({ type: 'double' })
  stock_apres: number;

  @Column({ type: 'double' })
  retour: number;

  @ManyToOne(() => CommandeVente, (commande) => commande.lignes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_commande_vente' })
  commandeVente: CommandeVente;

  @ManyToOne(() => Produit, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'designation' })
  produit: Produit;
}
