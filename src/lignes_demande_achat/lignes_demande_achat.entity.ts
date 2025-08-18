import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('lignes_demande_achat')
export class LignesDemandeAchat {
  @PrimaryGeneratedColumn()
  id_ligne_demande_achat: number;

  @Column({ type: 'int', })
  id_mp: number;

  @Column({ type: 'int', })
  id_produit: number;

  @Column({ type: 'float', })
  quantite: number;

  @Column({ type: 'double', })
  prix_unitaire: number;

  @Column({ type: 'double', })
  montant_ligne: number;

  @Column({ type: 'int', })
  id_variete: number;

  @Column({ type: 'int', })
  id_demande_achat: number;

  @Column({ type: 'varchar', length: 16, })
  date: string;

  @Column({ type: 'int', })
  statut: number;

}
