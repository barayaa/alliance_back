import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('fournisseur')
export class Fournisseur {
  @PrimaryGeneratedColumn()
  id_fournisseur: number;

  @Column({ type: 'varchar', length: 40, })
  fournisseur: string;

  @Column({ type: 'varchar', length: 40, })
  adresse: string;

  @Column({ type: 'varchar', length: 30, })
  email: string;

}
