import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('releve_factures')
export class ReleveFactures {
  @PrimaryGeneratedColumn()
  id_releve_factures: number;

  @Column({ type: 'int', })
  id_client: number;

  @Column({ type: 'varchar', length: 25, })
  numeros_factures: string;

  @Column({ type: 'date', })
  date_emission: Date;

  @Column({ type: 'date', })
  dernier_delai: Date;

  @Column({ type: 'varchar', length: 10, })
  statut: string;

}
