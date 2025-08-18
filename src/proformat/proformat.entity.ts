import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Client } from '../client/client.entity';
import { LignesProformat } from '../lignes_proformat/lignes_proformat.entity';

@Entity('proformat')
export class Proformat {
  @PrimaryGeneratedColumn()
  id_commande_vente: number;

  @Column({ type: 'datetime' })
  date_commande_vente: Date;

  @Column({ type: 'double' })
  montant_total: number;

  @Column({ type: 'double' })
  montant_paye: number;

  @Column({ type: 'double' })
  montant_restant: number;

  @Column({ type: 'int', nullable: true })
  remise: number | null;

  @Column({ type: 'int' })
  validee: number;

  @Column({ type: 'int' })
  statut: number;

  @Column({ type: 'int' })
  id_client: number;

  @ManyToOne(() => Client, { nullable: false })
  @JoinColumn({ name: 'id_client' })
  client: Client;

  @Column({ type: 'int' })
  reglee: number;

  @Column({ type: 'int' })
  moyen_reglement: number;

  @Column({ type: 'varchar', length: 1 })
  type_reglement: string;

  @Column({ type: 'double' })
  tva: number;

  @Column({ type: 'varchar', length: 2 })
  type_isb: string;

  @Column({ type: 'double' })
  isb: number;

  @Column({ type: 'int' })
  avoir: number;

  @Column({ type: 'varchar', length: 15 })
  login: string;

  @Column({ type: 'varchar', length: 4 })
  type_facture: string;

  @Column({ type: 'varchar', length: 50 })
  reponse_mcf: string;

  @Column({ type: 'varchar', length: 50 })
  qrcode: string;

  @Column({ type: 'varchar', nullable: true, length: 25 })
  client_vd: string | null;

  @Column({ type: 'varchar', nullable: true, length: 10 })
  nif_vd: string | null;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  adresse_vd: string | null;

  @Column({ type: 'varchar', nullable: true, length: 12 })
  telephone_vd: string | null;

  @Column({ type: 'varchar', nullable: true, length: 30 })
  email_vd: string | null;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  ville_vd: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  commentaire1: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  commentaire2: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  commentaire3: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  commentaire4: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  commentaire5: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  commentaire6: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  commentaire7: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  commentaire8: string | null;

  @Column({ type: 'varchar', length: 3 })
  certifiee: string;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  counter_per_receipt_type: string | null;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  total_receipt_counter: string | null;

  @Column({ type: 'varchar', nullable: true, length: 3 })
  receipt_type: string | null;

  @Column({ type: 'varchar', nullable: true, length: 15 })
  process_date_and_time: string | null;

  @Column({ type: 'varchar', nullable: true, length: 15 })
  device_dentification: string | null;

  @Column({ type: 'varchar', nullable: true, length: 15 })
  nif_: string | null;

  @Column({ type: 'varchar', nullable: true, length: 30 })
  signature: string | null;

  @Column({ type: 'varchar', nullable: true, length: 25 })
  ref_ini: string | null;

  @Column({ type: 'varchar', nullable: true, length: 1 })
  exoneration: string | null;

  @Column({ type: 'int' })
  numero_seq: number;

  @Column({ type: 'varchar', length: 15 })
  numero_facture_certifiee: string;

  @Column({ type: 'int' })
  imprimee: number;

  @Column({ type: 'int' })
  statut_proformat: number;

  @Column({ type: 'varchar', length: 3 })
  facture_definitive: string;

  @OneToMany(() => LignesProformat, (ligne) => ligne.proformat, {
    cascade: true,
  })
  lignes: LignesProformat[];
}
