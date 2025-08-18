import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Produit } from '../produit/produit.entity';

@Entity('voie_administration')
export class VoieAdministration {
  @PrimaryGeneratedColumn()
  id_voie_administration: number;

  @Column({ type: 'varchar', length: 35 })
  voie_administration: string;

  @OneToMany(() => Produit, (produit) => produit.voie_administration)
  produits: Produit[];
}
