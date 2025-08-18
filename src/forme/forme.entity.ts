import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Produit } from '../produit/produit.entity';

@Entity('forme')
export class Forme {
  @PrimaryGeneratedColumn()
  id_forme: number;

  @Column({ type: 'varchar', length: 25 })
  forme: string;

  @OneToMany(() => Produit, (produit) => produit.forme)
  produits: Produit[];
}
