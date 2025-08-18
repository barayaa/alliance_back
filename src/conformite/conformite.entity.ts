import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('conformite')
export class Conformite {
  @PrimaryGeneratedColumn()
  id_conformite: number;

  @Column({ type: 'varchar', length: 10, })
  conformite: string;

}
