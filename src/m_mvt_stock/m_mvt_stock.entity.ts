import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Produit } from '../produit/produit.entity';
import { TypeMvt } from '../type_mvt/type_mvt.entity';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';
import { TitulaireAmm } from '../titulaire_amm/titulaire_amm.entity';

@Entity('m_mvt_stock')
export class MMvtStock {
  @PrimaryGeneratedColumn()
  id_mouvement: number;

  @Column({ type: 'int' })
  id_produit: number;

  @ManyToOne(() => Produit, (produit) => produit.mouvements, { nullable: true })
  @JoinColumn({ name: 'id_produit' })
  produit: Produit;

  @Column({ type: 'float', nullable: true })
  quantite: number | null;

  @Column({ type: 'float', nullable: true })
  quantite_commandee: number | null;

  @Column({ type: 'int' })
  cout: number;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  user: string | null;

  @Column({ type: 'int' })
  type: number;

  @ManyToOne(() => TypeMvt, (typeMvt) => typeMvt.mouvements, { nullable: true })
  @JoinColumn({ name: 'type' })
  typeMvt: TypeMvt;

  @Column({ type: 'int' })
  magasin: number;

  @Column({ type: 'text' })
  commentaire: string;

  @Column({ type: 'float' })
  stock_avant: number;

  @Column({ type: 'float' })
  stock_apres: number;

  // @Column({ type: 'varchar', nullable: true })
  // id_commande_vente: number | string;

  @Column({ type: 'int', nullable: true }) // Change en int pour correspondre à id_commande_vente
  id_commande_vente: number | null;

  @Column({ type: 'varchar', length: 3 })
  annule: string;

  @ManyToOne(() => CommandeVente, { nullable: true })
  @JoinColumn({
    name: 'id_commande_vente',
    referencedColumnName: 'numero_facture_certifiee',
  })
  commandeVente: CommandeVente;

  @ManyToOne(() => LignesCommandeVente, { nullable: true })
  @JoinColumn({
    name: 'id_commande_vente',
    referencedColumnName: 'id_commande_vente',
  })
  ligneCommandeVente: LignesCommandeVente;

  @Column({ type: 'varchar', length: 50, nullable: true })
  num_lot: string;

  @Column({ type: 'datetime', nullable: true })
  date_expiration: Date;

  @Column({ type: 'varchar', length: 10, nullable: true })
  conformite: string;
}
