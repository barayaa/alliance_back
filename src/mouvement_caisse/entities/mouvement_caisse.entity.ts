import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Caisse } from 'src/caisse/entities/caisse.entity';
import { Depense } from 'src/depense/entities/depense.entity';
import { Reglement } from 'src/reglement/reglement.entity';

@Entity('mouvement_caisse')
export class MouvementCaisse {
  @PrimaryGeneratedColumn()
  id_mouvement: number;

  @ManyToOne(() => Caisse, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_caisse' })
  caisse: Caisse;

  @Column()
  id_caisse: number;

  @Column({ type: 'varchar', length: 20 })
  type_mouvement: string; // 'ENTREE' ou 'SORTIE'

  @Column({ type: 'double' })
  montant: number;

  @Column({ type: 'datetime' })
  date_mouvement: Date;

  @Column({ type: 'varchar', length: 50 })
  type_operation: string; // 'REGLEMENT', 'DEPENSE', 'APPROVISIONNEMENT', etc.

  // Relations optionnelles pour lier au document source
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
  libelle?: string; // Description du mouvement
}
