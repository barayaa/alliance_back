import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Client } from '../client/client.entity';
import { CommandeVente } from '../commande_vente/commande_vente.entity';
import { TypeReglement } from 'src/type_reglement/type_reglement.entity';
import { Caisse } from 'src/caisse/entities/caisse.entity';
import { Compte } from 'src/comptes/entities/compte.entity';
import { Nita } from 'src/nita/entities/nita.entity';

@Entity('reglement')
export class Reglement {
  @Column({ type: 'int' })
  id_client: number;

  @ManyToOne(() => Client, (client) => client.id_client, { eager: false })
  @JoinColumn({ name: 'id_client', referencedColumnName: 'id_client' })
  client: Client;

  @Column({ type: 'double' })
  montant: number;

  @Column({ type: 'varchar' })
  date: string;

  @PrimaryGeneratedColumn()
  id_reglement: number;

  @Column({ type: 'varchar' })
  id_commande_vente: string;

  @ManyToOne(
    () => CommandeVente,
    (commandeVente) => commandeVente.id_commande_vente,
    {
      eager: false,
    },
  )
  @JoinColumn({
    name: 'id_commande_vente',
    referencedColumnName: 'id_commande_vente',
  })
  commandeVente: CommandeVente;

  @Column({ type: 'int' })
  id_type_reglement: number;

  @ManyToOne(
    () => TypeReglement,
    (typeReglement) => typeReglement.id_type_reglement,
    { eager: false },
  )
  @JoinColumn({
    name: 'id_type_reglement',
    referencedColumnName: 'id_type_reglement',
  })
  typeReglement: TypeReglement;

  @Column({ type: 'int', nullable: true })
  id_caisse?: number;

  @ManyToOne(() => Caisse, (caisse) => caisse.id_caisse, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'id_caisse', referencedColumnName: 'id_caisse' })
  caisse?: Caisse;

  @Column({ type: 'int', nullable: true })
  id_compte?: number;

  @ManyToOne(() => Compte, (compte) => compte.id_compte, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'id_compte', referencedColumnName: 'id_compte' })
  compte?: Compte;

  @Column({ type: 'int', nullable: true })
  id_nita?: number;

  @ManyToOne(() => Nita, (nita) => nita.mouvements, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'id_nita', referencedColumnName: 'id_nita' })
  nita?: Nita;
}
