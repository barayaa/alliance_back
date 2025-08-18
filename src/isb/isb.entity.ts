import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('isb')
export class Isb {
  @PrimaryGeneratedColumn()
  id_isb: number;

  @Column({ type: 'varchar', length: 15, })
  isb: string;

  @Column({ type: 'varchar', length: 5, })
  taux: string;

}
