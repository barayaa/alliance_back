import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('nature_reclamation')
export class NatureReclamation {
  @PrimaryGeneratedColumn()
  id_nature_reclamation: number;

  @Column({ type: 'varchar', length: 40, })
  nature_reclamation: string;

}
