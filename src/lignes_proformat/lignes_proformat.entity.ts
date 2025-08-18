import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Proformat } from '../proformat/proformat.entity';

@Entity('lignes_proformat')
export class LignesProformat {
  @PrimaryGeneratedColumn()
  id_ligne_commande_vente: number;

  @Column({ type: 'int' }) // Changé de varchar à int
  id_commande_vente: number;

  @ManyToOne(() => Proformat, (proformat) => proformat.lignes)
  @JoinColumn({ name: 'id_commande_vente' })
  proformat: Proformat;

  @Column({ type: 'int' })
  designation: number;

  @Column({ type: 'double' })
  prix_vente: number;

  @Column({ type: 'double' })
  remise: number;

  @Column({ type: 'varchar', nullable: true, length: 30 })
  description_remise: string | null;

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

  @Column({ type: 'int' })
  statut_proformat: number;

  // @ManyToOne(() => Proformat, (proformat) => proformat.lignes)
  // proformat: Proformat;
}
