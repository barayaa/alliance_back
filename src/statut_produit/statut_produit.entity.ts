import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Produit } from '../produit/produit.entity';

@Entity('statut_produit')
export class StatutProduit {
  @PrimaryGeneratedColumn()
  id_statut_produit: number;

  @Column({ type: 'varchar', length: 35 })
  statut_produit: string;

  @OneToMany(() => Produit, (produit) => produit.statut_produit)
  produits: Produit[];
}
