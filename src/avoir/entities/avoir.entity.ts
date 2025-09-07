import { Client } from 'src/client/client.entity';
import { CommandeVente } from 'src/commande_vente/commande_vente.entity';
import { LigneAvoir } from 'src/ligne_avoir/entities/ligne_avoir.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Avoir {
  @PrimaryGeneratedColumn()
  id_avoir: number;

  @Column({ nullable: true })
  date_avoir: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montant_total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montant_restant: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  remise: number;

  @Column({ default: 1 })
  validee: number;

  @Column({ default: 0 })
  statut: number;

  @Column()
  id_client: number;

  @ManyToOne(() => Client, (client) => client.avoirs, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_client', referencedColumnName: 'id_client' })
  client: Client;

  //   @ManyToOne(() => Client, (client) => client.avoirs)
  //   client: Client;

  @Column({ default: 0 })
  reglee: number;

  @Column({ default: 0 })
  moyen_reglement: number;

  @Column()
  type_reglement: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tva: number;

  @Column()
  type_isb: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  isb: number;

  @Column()
  login: string;

  @Column()
  ref_ini: string;

  @ManyToOne(() => CommandeVente, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'facture_vente_id',
    referencedColumnName: 'id_commande_vente',
  })
  facture_vente: CommandeVente;

  @Column()
  numero_seq: number;

  @Column()
  numero_facture_certifiee: string;

  @Column({ default: 1 })
  imprimee: number;

  @Column({ default: 'NON' })
  certifiee: string;

  @Column({ nullable: true })
  commentaire1: string;

  @Column({ nullable: true })
  commentaire2: string;

  @Column({ nullable: true })
  commentaire3: string;

  @Column({ nullable: true })
  commentaire4: string;

  @Column({ nullable: true })
  commentaire5: string;

  @Column({ nullable: true })
  commentaire6: string;

  @Column({ nullable: true })
  commentaire7: string;

  @Column({ nullable: true })
  commentaire8: string;

  @OneToMany(() => LigneAvoir, (ligne) => ligne.avoir, { cascade: true })
  lignes: LigneAvoir[];
}
