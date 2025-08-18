import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Produit } from '../produit/produit.entity';

@Entity('marque')
export class Marque {
  @PrimaryGeneratedColumn()
  id_marque: number;

  @Column({ type: 'varchar', length: 35 })
  marque: string;

  @OneToMany(() => Produit, (produit) => produit.marque)
  produits: Produit[];
}
