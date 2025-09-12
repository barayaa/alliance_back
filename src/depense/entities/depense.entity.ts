import { Caisse } from 'src/caisse/entities/caisse.entity';
import { Compte } from 'src/comptes/entities/compte.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('depense')
export class Depense {
  @PrimaryGeneratedColumn()
  id_depense: number;

  @Column({ type: 'double' })
  montant: number;

  @Column({ type: 'varchar' })
  date: string; // Keeping as string to match Compte's date format

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Compte, (compte) => compte.depenses, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_compte' })
  compte?: Compte;

  @ManyToOne(() => Caisse, (caisse) => caisse.depenses, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_caisse' })
  caisse?: Caisse;
}
