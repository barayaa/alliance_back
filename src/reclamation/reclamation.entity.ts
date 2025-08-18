import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Produit } from '../produit/produit.entity';
import { NatureReclamation } from '../nature_reclamation/nature_reclamation.entity';
// import { NatureReclamation } from '../naturereclamation/naturereclamation.entity';
@Entity('reclamation')
export class Reclamation {
  @PrimaryGeneratedColumn()
  id_reclamation: number;

  @Column({ type: 'int' })
  quantite: number;

  @Column({ type: 'double' })
  prix_grossiste: number;

  @Column({ type: 'int' })
  numero_facture: number;

  @Column({ type: 'datetime', nullable: true })
  date: Date;

  @Column({ type: 'int', nullable: false })
  cle_produit: number;

  @ManyToOne(() => Produit, { nullable: false })
  @JoinColumn({ name: 'cle_produit', referencedColumnName: 'id_produit' })
  produit: Produit;

  @Column({ type: 'int', nullable: false })
  cle_nature_reclamation: number;

  @ManyToOne(() => NatureReclamation, { nullable: false })
  @JoinColumn({
    name: 'cle_nature_reclamation',
    referencedColumnName: 'id_nature_reclamation',
  })
  nature_reclamation: NatureReclamation;
  // @PrimaryGeneratedColumn()
  // id_reclamation: number;

  // @Column({ type: 'int' })
  // quantite: number;

  // @Column({ type: 'double' })
  // prix_grossiste: number;

  // @Column({ type: 'int' })
  // numero_facture: number;

  // @Column({ type: 'int' })
  // date: number;

  // @ManyToOne(() => Produit)
  // cle_produit: Produit;

  // @ManyToOne(() => NatureReclamation)
  // cle_nature_reclamation: NatureReclamation;
}
