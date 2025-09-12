import { Banque } from 'src/banques/entities/banque.entity';
import { Depense } from 'src/depense/entities/depense.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('compte')
export class Compte {
  @PrimaryGeneratedColumn()
  id_compte: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  numero_compte: string;

  @ManyToOne(() => Banque, (banque) => banque.comptes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_banque' })
  banque: Banque;

  @Column({ type: 'double', default: 0 })
  solde: number;

  @OneToMany(() => Depense, (depense) => depense.compte)
  depenses: Depense[];

  @Column({ type: 'varchar' })
  date_creation: string;

  @Column({ type: 'varchar', nullable: true })
  date_fermeture?: string;
}
