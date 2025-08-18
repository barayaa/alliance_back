import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('statut')
export class Statut {
  @PrimaryGeneratedColumn()
  id_statut: number;

  @Column({ type: 'varchar', length: 25, })
  statut: string;

}
