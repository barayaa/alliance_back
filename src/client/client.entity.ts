import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Statut } from '../statut/statut.entity';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { Avoir } from 'src/avoir/entities/avoir.entity';
@Entity('client')
export class Client {
  @PrimaryGeneratedColumn()
  id_client: number;

  @Column({ type: 'varchar', length: 25 })
  nom: string;

  @Column({ type: 'varchar', length: 25 })
  prenom: string;

  @Column({ type: 'varchar', length: 25 })
  telephone: string;

  @Column({ type: 'varchar', length: 25 })
  ville: string;

  @Column({ type: 'varchar', length: 100 })
  adresse: string;

  @Column({ type: 'int' })
  compte: number;

  @Column({ type: 'double', default: 0 })
  avance: number;

  @Column({ type: 'varchar', length: 25 })
  fax: string;

  @Column({ type: 'varchar', length: 25 })
  email: string;

  @Column({ type: 'double' })
  solde: number;

  @Column({ type: 'varchar', length: 15 })
  nif: string;

  @Column({ type: 'varchar', length: 30 })
  login: string;

  @Column({ type: 'varchar', length: 50 })
  password: string;

  @Column({ type: 'int', nullable: false, default: 1 })
  cle_statut: number;

  @ManyToOne(() => Statut, { nullable: false })
  @JoinColumn({ name: 'cle_statut', referencedColumnName: 'id_statut' })
  statut: Statut;

  @OneToMany(() => CommandeVente, (commandeVente) => commandeVente.client)
  commandesVente: CommandeVente[];

  @OneToMany(() => Avoir, (avoir) => avoir.client)
  avoirs: Avoir[];
}
