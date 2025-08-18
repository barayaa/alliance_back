import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Produit } from '../produit/produit.entity';

@Entity('fabricant')
export class Fabricant {
  @PrimaryGeneratedColumn()
  id_fabricant: number;

  @Column({ type: 'varchar', length: 35 })
  fabricant: string;

  @OneToMany(() => Produit, (produit) => produit.fabricant)
  produits: Produit[];
}
