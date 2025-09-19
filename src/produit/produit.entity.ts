import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
// import { Marque } from '../marque/marque.entity';
import { Forme } from '../forme/forme.entity';
import { VoieAdministration } from '../voie_administration/voie_administration.entity';
import { ClasseTherapeutique } from '../classe_therapeutique/classe_therapeutique.entity';
import { StatutProduit } from '../statut_produit/statut_produit.entity';
import { TitulaireAmm } from '../titulaire_amm/titulaire_amm.entity';
// import { Fabricant } from '../fabricant/fabricant.entity';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';
// import { SuiviStock } from '../suivi_stock/suivi_stock.entity';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';
import { CaptureStock } from '../capture_stock/capture_stock.entity';
import { Marque } from 'src/marque/marque.entity';
import { Fabricant } from 'src/fabricant/fabricant.entity';
import { SuiviStock } from 'src/suivi_stock/suivi_stock.entity';
import { Audit } from 'src/audit/entities/audit.entity';

@Entity('produit')
export class Produit {
  @PrimaryGeneratedColumn()
  id_produit: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  produit: string;

  @Column({ type: 'varchar', length: 50 })
  denomination_commune_internationale: string;

  @Column({ type: 'varchar', length: 50 })
  dosage: string;

  @Column({ type: 'varchar', length: 25 })
  presentation: string;

  @Column({ type: 'varchar', length: 25 })
  n_amm: string;

  @Column({ type: 'varchar', length: 25 })
  validite_amm: string;

  @Column('double', { default: 0 })
  prix_vente: number;

  @Column({ type: 'double' })
  pght: number;

  @Column({ type: 'double' })
  prix_unitaire: number;

  @Column({ type: 'int' })
  stock_min: number;

  @Column({ type: 'float' })
  stock_courant: number;

  @Column({ type: 'varchar', length: 10 })
  group_tva: string;

  @Column({ type: 'varchar', length: 5 })
  etiquette_tva: string;

  @Column({ type: 'float' })
  taux_tva: number;

  @Column({ type: 'int' })
  entree: number;

  @Column({ type: 'int' })
  sortie_fv: number;

  @Column({ type: 'int' })
  sortie_bs: number;

  @Column({ type: 'int' })
  avoir: number;

  @Column({ type: 'int' })
  amb_entree: number;

  @Column({ type: 'int' })
  amb_sortie: number;

  @Column({ type: 'double' })
  stock_courant_date: number;

  // === Clé étrangère (id) + relation ===

  @Column({ type: 'int', nullable: true })
  cle_marque: number;

  @ManyToOne(() => Marque, (marque) => marque.produits, { nullable: true })
  @JoinColumn({ name: 'cle_marque' })
  marque: Marque;

  @Column({ type: 'int', nullable: true })
  cle_forme: number;

  @ManyToOne(() => Forme, (forme) => forme.produits, { nullable: true })
  @JoinColumn({ name: 'cle_forme' })
  forme: Forme;

  @Column({ type: 'int', nullable: true })
  cle_voie_administration: number;

  @ManyToOne(() => VoieAdministration, (voie) => voie.produits, {
    nullable: true,
  })
  @JoinColumn({ name: 'cle_voie_administration' })
  voie_administration: VoieAdministration;

  @Column({ type: 'int', nullable: true })
  cle_classe_therapeutique: number;

  @ManyToOne(() => ClasseTherapeutique, (classe) => classe.produits, {
    nullable: true,
  })
  @JoinColumn({ name: 'cle_classe_therapeutique' })
  classe_therapeutique: ClasseTherapeutique;

  @Column({ type: 'int', nullable: true })
  cle_statut_produit: number;

  @ManyToOne(() => StatutProduit, (statut) => statut.produits, {
    nullable: true,
  })
  @JoinColumn({ name: 'cle_statut_produit' })
  statut_produit: StatutProduit;

  @Column({ type: 'int', nullable: true })
  cle_titulaire_amm: number;

  @ManyToOne(() => TitulaireAmm, (titulaire) => titulaire.produits, {
    nullable: true,
  })
  @JoinColumn({ name: 'cle_titulaire_amm' })
  titulaire_amm: TitulaireAmm;

  @Column({ type: 'int', nullable: true })
  cle_fabricant: number;

  @ManyToOne(() => Fabricant, (fabricant) => fabricant.produits, {
    nullable: true,
  })
  @JoinColumn({ name: 'cle_fabricant' })
  fabricant: Fabricant;

  @OneToMany(
    () => LignesCommandeVente,
    (lignesCommandeVente) => lignesCommandeVente.designation,
  )
  lignescommandeventes: LignesCommandeVente[];

  @OneToMany(() => SuiviStock, (suiviStock) => suiviStock.produit)
  suiviStocks: SuiviStock[];

  @OneToMany(() => MMvtStock, (mouvement) => mouvement.produit)
  mouvements: MMvtStock[];

  @OneToMany(() => CaptureStock, (captureStock) => captureStock.produit)
  captureStocks: CaptureStock[];

  @OneToMany(() => Audit, (audit) => audit.produit)
  audits: Audit[];
}
