import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('moyen_reglement')
export class MoyenReglement {
  @PrimaryGeneratedColumn()
  id_moyen: number;

  @Column({ type: 'varchar', length: 30, })
  moyen: string;

}
