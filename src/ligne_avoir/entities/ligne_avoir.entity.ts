import { Avoir } from 'src/avoir/entities/avoir.entity';
import { Produit } from 'src/produit/produit.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class LigneAvoir {
  @PrimaryGeneratedColumn()
  id_ligne_avoir: number;

  @Column()
  id_avoir: number;

  @ManyToOne(() => Avoir, (avoir) => avoir.lignes)
  @JoinColumn({ name: 'id_avoir' })
  avoir: Avoir;

  @Column()
  designation: number; // id_produit

  @ManyToOne(() => Produit)
  @JoinColumn({ name: 'designation', referencedColumnName: 'id_produit' })
  produit: Produit;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  prix_vente: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  remise: number;

  @Column({ nullable: true })
  description_remise: string;

  @Column()
  prix_vente_avant_remise: string;

  @Column()
  quantite: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montant: number;

  @Column()
  group_tva: string;

  @Column()
  etiquette_tva: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  taux_tva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montant_tva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  isb_ligne: number;

  @Column()
  date: Date;

  @Column()
  stock_avant: number;

  @Column()
  stock_apres: number;

  @Column({ default: 0 })
  retour: number;
}
