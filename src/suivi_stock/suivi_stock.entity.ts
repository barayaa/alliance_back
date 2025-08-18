import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Produit } from '../produit/produit.entity';

@Entity('suivi_stock')
export class SuiviStock {
  @PrimaryGeneratedColumn()
  id_suivi_stock: number;

  @Column({ type: 'date' })
  date_print: Date;

  // @Column({ type: 'int', })
  // id_produit: number;

  @ManyToOne(() => Produit, (produit) => produit.suiviStocks)
  @JoinColumn({ name: 'id_produit' })
  produit: Produit;

  @Column({ type: 'double' })
  entree: number;

  @Column({ type: 'double' })
  sortie: number;

  @Column({ type: 'double' })
  stock: number;
}
