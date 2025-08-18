import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CommandeAchat } from '../commande_achat/commande_achat.entity';
import { Produit } from '../produit/produit.entity';

@Entity('lignes_commande_achat')
export class LignesCommandeAchat {
  // @PrimaryGeneratedColumn()
  // id_ligne_commande_achat: number;

  // @Column()
  // id_commande_achat: number;

  // @Column()
  // designation: number; // id_produit

  // @Column({ type: 'double', nullable: true })
  // pu: number;

  // @Column({ type: 'float', nullable: true })
  // remise: number;

  // @Column({ type: 'double' })
  // quantite: number;

  // @Column({ type: 'double', nullable: true })
  // montant: number;

  // @Column({ type: 'double', nullable: true })
  // montant_tva: number;

  // @Column({ type: 'date' })
  // date: Date;

  // @Column()
  // qty_commandee: number;

  // @Column()
  // numero_lot: string;

  // @Column({ type: 'varchar', length: 10 })
  // date_expiration: string;

  // @Column()
  // conformite: string;

  // @ManyToOne(() => Produit, { eager: true })
  // @JoinColumn({ name: 'id_produit', referencedColumnName: 'id_produit' })
  // produit: Produit;

  // @ManyToOne(() => CommandeAchat, (commande) => commande.lignes, {
  //   eager: true,
  // })
  // @JoinColumn({
  //   name: 'id_commande_achat',
  //   referencedColumnName: 'id_commande_achat',
  // })
  // commande_achat: CommandeAchat;

  // // @ManyToOne(() => CommandeAchat, (commande) => commande.lignes)
  // // commande_achat: CommandeAchat;

  @PrimaryGeneratedColumn({ name: 'id_ligne_commande_achat' })
  id_ligne_commande_achat: number;

  @Column()
  id_commande_achat: number;

  @Column()
  designation: number;

  @Column({ type: 'double', nullable: true })
  pu: number;

  @Column({ type: 'float', nullable: true })
  remise: number;

  @Column({ type: 'double' })
  quantite: number;

  @Column({ type: 'double', nullable: true })
  montant: number;

  @Column({ type: 'double', nullable: true })
  montant_tva: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  qty_commandee: number;

  @Column({ type: 'varchar', length: 25, nullable: true })
  numero_lot: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  date_expiration: string;

  @Column({ type: 'varchar', length: 3, nullable: true })
  conformite: string;

  @ManyToOne(() => Produit, { eager: true })
  @JoinColumn({ name: 'designation', referencedColumnName: 'id_produit' })
  produit: Produit;

  @ManyToOne(() => CommandeAchat, (commande) => commande.lignes, {
    eager: true,
  })
  @JoinColumn({
    name: 'id_commande_achat',
    referencedColumnName: 'id_commande_achat',
  })
  commande_achat: CommandeAchat;
}
