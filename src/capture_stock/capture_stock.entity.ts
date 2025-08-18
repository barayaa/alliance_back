import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Produit } from '../produit/produit.entity';

@Entity('capture_stock')
export class CaptureStock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  id_produit: number | null;

  @Column({ type: 'double' })
  stock_courant: number;

  @Column({ type: 'datetime' })
  date_capture: Date;

  @ManyToOne(() => Produit, (produit) => produit.captureStocks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_produit' })
  produit: Produit;
}
