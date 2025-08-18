import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { TitulaireAmm } from '../titulaire_amm/titulaire_amm.entity';
import { Destination } from '../destination/destination.entity';
import { LignesCommandeAchat } from '../lignes_commande_achat/lignes_commande_achat.entity';

@Entity('commande_achat')
export class CommandeAchat {
  @PrimaryGeneratedColumn({ name: 'id_commande_achat' })
  id_commande_achat: number;

  @Column({ type: 'datetime' })
  date_commande_achat: Date;

  @Column({ type: 'double', nullable: true })
  montant_total: number | null;

  @Column({ type: 'double', nullable: true })
  montant_paye: number | null;

  @Column({ type: 'double', nullable: true })
  montant_restant: number | null;

  @Column({ type: 'int', default: 1 })
  validee: number;

  @Column({ type: 'int', default: 0 })
  statut: number;

  @ManyToOne(() => TitulaireAmm, { nullable: false })
  @JoinColumn({ name: 'id_fournisseur' })
  titulaire_amm: TitulaireAmm;

  @Column({ type: 'int', default: 0 })
  reglee: number;

  @Column({ type: 'int', nullable: true })
  moyen_reglement: number;

  @Column({ type: 'int', nullable: true })
  type_reglement: number;

  @Column({ type: 'double', nullable: true })
  tva: number | null;

  @Column({ type: 'int', default: 0 })
  avoir: number;

  @Column({ type: 'varchar', length: 40 })
  reference: string;

  @Column({ type: 'varchar', length: 20 })
  user: string;

  @ManyToOne(() => Destination, { nullable: false })
  @JoinColumn({ name: 'id_destination' })
  destination: Destination;

  @OneToMany(() => LignesCommandeAchat, (ligne) => ligne.commande_achat)
  lignes: LignesCommandeAchat[];
  // @PrimaryGeneratedColumn()
  // id_commande_achat: number;

  // @Column({ type: 'datetime' })
  // date_commande_achat: Date;

  // @Column({ type: 'double', nullable: true })
  // montant_total: number | null;

  // @Column({ type: 'double', nullable: true })
  // montant_paye: number | null;

  // @Column({ type: 'double', nullable: true })
  // montant_restant: number | null;

  // @Column({ type: 'int' })
  // validee: number;

  // @Column({ type: 'int' })
  // statut: number;

  // @Column({ type: 'int' })
  // id_fournisseur: number;

  // @ManyToOne(() => TitulaireAmm, { nullable: false })
  // @JoinColumn({ name: 'id_fournisseur' })
  // titulaire_amm: TitulaireAmm;

  // @Column({ type: 'int' })
  // reglee: number;

  // @Column({ type: 'int' })
  // moyen_reglement: number;

  // @Column({ type: 'int' })
  // type_reglement: number;

  // @Column({ type: 'double', nullable: true })
  // tva: number | null;

  // @Column({ type: 'int' })
  // avoir: number;

  // @Column({ type: 'varchar', length: 40 })
  // reference: string;

  // @Column({ type: 'varchar', length: 20 })
  // user: string;

  // @Column({ type: 'int' })
  // id_destination: number;

  // @ManyToOne(() => Destination, { nullable: false })
  // @JoinColumn({ name: 'id_destination' })
  // destination: Destination;

  // @OneToMany(() => LignesCommandeAchat, (ligne) => ligne.commande_achat)
  // lignes: LignesCommandeAchat[];
}
