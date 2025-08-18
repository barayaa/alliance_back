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
}
