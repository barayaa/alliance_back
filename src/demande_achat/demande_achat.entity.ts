import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('demande_achat')
export class DemandeAchat {
  @PrimaryGeneratedColumn()
  id_demande_achat: number;

  @Column({ type: 'varchar', length: 20, })
  date: string;

  @Column({ type: 'varchar', length: 15, })
  user: string;

  @Column({ type: 'int', })
  cloture: number;

  @Column({ type: 'int', })
  type_doc: number;

  @Column({ type: 'int', })
  niveau: number;

  @Column({ type: 'int', })
  statut: number;

  @Column({ type: 'text', })
  commentaire_rejet: string;

  @Column({ type: 'int', })
  valide: number;

  @Column({ type: 'text', })
  commentaire: string;

  @Column({ type: 'int', })
  sortie_conforme: number;

  @Column({ type: 'varchar', length: 40, })
  demandeur: string;

  @Column({ type: 'double', })
  montant_total: number;

  @Column({ type: 'int', })
  id_fournisseur: number;

}
