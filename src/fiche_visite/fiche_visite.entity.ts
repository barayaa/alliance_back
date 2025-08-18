import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('fiche_visite')
export class FicheVisite {
  @PrimaryGeneratedColumn()
  id_fiche_visite: number;

  @Column({ type: 'varchar', length: 50, })
  nom_prenom_visiteur: string;

  @Column({ type: 'varchar', length: 50, })
  personne_visitee: string;

  @Column({ type: 'varchar', length: 40, })
  fonction: string;

  @Column({ type: 'varchar', length: 20, })
  numero_telephone: string;

  @Column({ type: 'text', })
  objectifs_visite: string;

  @Column({ type: 'varchar', length: 100, })
  produits_abordes: string;

  @Column({ type: 'text', })
  actions_realises: string;

  @Column({ type: 'text', })
  besoins_ou_remarques_des_clients: string;

  @Column({ type: 'varchar', length: 100, })
  prochaine_etape: string;

  @Column({ type: 'text', })
  commentaires: string;

  @Column({ type: 'varchar', length: 30, })
  aut_utilisateur: string;

}
