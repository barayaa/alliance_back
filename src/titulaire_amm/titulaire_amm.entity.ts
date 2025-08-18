import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Produit } from '../produit/produit.entity';
import { CommandeVente } from '../commande_vente/commande_vente.entity';

@Entity('titulaire_amm')
export class TitulaireAmm {
  @PrimaryGeneratedColumn()
  id_titulaire_amm: number;

  @Column({ type: 'varchar', length: 35 })
  titulaire_amm: string;

  @OneToMany(() => Produit, (produit) => produit.titulaire_amm)
  produits: Produit[];

  // @OneToMany(() => CommandeVente, (commande) => commande.titulaire_amm)
  // commandes: CommandeVente[];
}
