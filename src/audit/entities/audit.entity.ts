import { Produit } from 'src/produit/produit.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit')
export class Audit {
  @PrimaryGeneratedColumn()
  id_audit: number;

  @Column({ type: 'int' })
  cle_produit: number;

  @ManyToOne(() => Produit, (produit) => produit.audits)
  @JoinColumn({ name: 'cle_produit' })
  produit: Produit;

  @Column({ type: 'float' })
  stock_courant_avant: number;

  @Column({ type: 'float' })
  stock_physique: number;

  @Column({ type: 'float' })
  difference: number;

  @Column({
    type: 'enum',
    enum: ['ajout', 'diminution', 'verification'],
    default: 'verification',
  })
  type_correction: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  user_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_nom: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date_audit: Date;
}
