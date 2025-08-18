import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';
import { TitulaireAmm } from '../titulaire_amm/titulaire_amm.entity';
import { Client } from '../client/client.entity';
import { Reglement } from '../reglement/reglement.entity';

@Entity('commande_vente')
export class CommandeVente {
  @PrimaryGeneratedColumn({ name: 'id_commande_vente' })
  id_commande_vente: number;

  @Column({ type: 'datetime', nullable: true })
  date_commande_vente: Date;

  @Column({ type: 'double' })
  montant_total: number;

  @Column({ type: 'double' })
  montant_paye: number;

  @Column({ type: 'double' })
  montant_restant: number;

  @Column({ type: 'int', nullable: true })
  remise: number;

  @Column({ type: 'int' })
  validee: number;

  @Column({ type: 'int' })
  statut: number;

  @Column({ type: 'int' })
  id_client: number;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'id_client' })
  client: Client;

  @Column({ type: 'int' })
  reglee: number;

  @Column({ type: 'int' })
  moyen_reglement: number;

  @Column({ type: 'varchar' })
  type_reglement: string;

  @Column({ type: 'double' })
  tva: number;

  @Column({ type: 'varchar' })
  type_isb: string;

  @Column({ type: 'double' })
  isb: number;

  @Column({ type: 'int' })
  avoir: number;

  @Column({ type: 'varchar' })
  login: string;

  @Column({ type: 'varchar' })
  type_facture: string;

  @Column({ type: 'varchar' })
  reponse_mcf: string;

  @Column({ type: 'varchar' })
  qrcode: string;

  @Column({ type: 'varchar', nullable: true })
  client_vd: string | null;

  @Column({ type: 'varchar', nullable: true })
  nif_vd: string | null;

  @Column({ type: 'varchar', nullable: true })
  adresse_vd: string | null;

  @Column({ type: 'varchar', nullable: true })
  telephone_vd: string | null;

  @Column({ type: 'varchar', nullable: true })
  email_vd: string | null;

  @Column({ type: 'varchar', nullable: true })
  ville_vd: string | null;

  @Column({ type: 'varchar', nullable: true })
  commentaire1: string | null;

  @Column({ type: 'varchar', nullable: true })
  commentaire2: string | null;

  @Column({ type: 'varchar', nullable: true })
  commentaire3: string | null;

  @Column({ type: 'varchar', nullable: true })
  commentaire4: string | null;

  @Column({ type: 'varchar', nullable: true })
  commentaire5: string | null;

  @Column({ type: 'varchar', nullable: true })
  commentaire6: string | null;

  @Column({ type: 'varchar', nullable: true })
  commentaire7: string | null;

  @Column({ type: 'varchar', nullable: true })
  commentaire8: string | null;

  @Column({ type: 'varchar' })
  certifiee: string;

  @Column({ type: 'varchar', nullable: true })
  counter_per_receipt_type: string | null;

  @Column({ type: 'varchar', nullable: true })
  total_receipt_counter: string | null;

  @Column({ type: 'varchar', nullable: true })
  receipt_type: string | null;

  @Column({ type: 'varchar', nullable: true })
  process_date_and_time: string | null;

  @Column({ type: 'varchar', nullable: true })
  device_dentification: string | null;

  @Column({ type: 'varchar', nullable: true })
  nif_: string | null;

  @Column({ type: 'varchar', nullable: true })
  signature: string | null;

  @Column({ type: 'varchar', nullable: true })
  ref_ini: string | null;

  @Column({ type: 'varchar', nullable: true })
  exoneration: string | null;

  @Column({ type: 'int' })
  numero_seq: number;

  @Column({ type: 'varchar' })
  numero_facture_certifiee: string;

  @Column({ type: 'int' })
  imprimee: number;

  @Column({ type: 'double' })
  escompte: number;

  @OneToMany(() => LignesCommandeVente, (ligne) => ligne.commandeVente)
  lignes: LignesCommandeVente[];

  @OneToMany(() => Reglement, (reglement) => reglement.commandeVente)
  reglements: Reglement[];
}
