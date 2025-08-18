import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Produit } from '../produit/produit.entity';

@Entity('classe_therapeutique')
export class ClasseTherapeutique {
  @PrimaryGeneratedColumn()
  id_classe_therapeutique: number;

  @Column({ type: 'varchar', length: 35 })
  classe_therapeutique: string;

  @OneToMany(() => Produit, (produit) => produit.classe_therapeutique)
  produits: Produit[];
}
