import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Nita } from 'src/nita/entities/nita.entity';
import { Depense } from 'src/depense/entities/depense.entity';
import { Reglement } from 'src/reglement/reglement.entity';

@Entity('mouvement_nita')
export class MouvementNita {
  @PrimaryGeneratedColumn()
  id_mouvement: number;

  @ManyToOne(() => Nita, (nita) => nita.depenses, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_nita' })
  nita: Nita;

  @Column({ type: 'int' })
  id_nita: number;

  @Column({ type: 'varchar', length: 20 })
  type_mouvement: string; // 'ENTREE' ou 'SORTIE'

  @Column({ type: 'double' })
  montant: number;

  @Column({ type: 'datetime' })
  date_mouvement: Date;

  @Column({ type: 'varchar', length: 50 })
  type_operation: string; // 'REGLEMENT', 'DEPENSE', 'APPROVISIONNEMENT', etc.

  // Relations optionnelles pour lier au document source
  @Column({ type: 'int', nullable: true })
  id_reglement?: number;

  @ManyToOne(() => Reglement, { nullable: true })
  @JoinColumn({ name: 'id_reglement' })
  reglement?: Reglement;

  @Column({ type: 'int', nullable: true })
  id_depense?: number;

  @ManyToOne(() => Depense, (depense) => depense.nita, { nullable: true })
  @JoinColumn({ name: 'id_depense' })
  depense?: Depense;

  @Column({ type: 'double' })
  solde_avant: number;

  @Column({ type: 'double' })
  solde_apres: number;

  @Column({ type: 'text', nullable: true })
  libelle?: string; // Description du mouvement
}
