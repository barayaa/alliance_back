import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Depense } from 'src/depense/entities/depense.entity';
import { Compte } from 'src/comptes/entities/compte.entity';
import { Reglement } from 'src/reglement/reglement.entity';

@Entity('mouvement_compte')
export class MouvementCompte {
  @PrimaryGeneratedColumn()
  id_mouvement: number;

  @ManyToOne(() => Compte, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_compte' })
  compte: Compte;

  @Column()
  id_compte: number;

  @Column({ type: 'varchar', length: 20 })
  type_mouvement: string; // 'CREDIT' ou 'DEBIT'

  @Column({ type: 'double' })
  montant: number;

  @Column({ type: 'datetime' })
  date_mouvement: Date;

  @Column({ type: 'varchar', length: 50 })
  type_operation: string; // 'REGLEMENT', 'DEPENSE', 'VIREMENT', etc.

  @Column({ nullable: true })
  id_reglement?: number;

  @ManyToOne(() => Reglement, { nullable: true })
  @JoinColumn({ name: 'id_reglement' })
  reglement?: Reglement;

  @Column({ nullable: true })
  id_depense?: number;

  @ManyToOne(() => Depense, { nullable: true })
  @JoinColumn({ name: 'id_depense' })
  depense?: Depense;

  @Column({ type: 'double' })
  solde_avant: number;

  @Column({ type: 'double' })
  solde_apres: number;

  @Column({ type: 'text', nullable: true })
  libelle?: string;

  @Column({ type: 'varchar', nullable: true })
  numero_piece?: string; // Numéro de chèque, référence virement, etc.
}
