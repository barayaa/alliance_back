import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('type_reglement')
export class TypeReglement {
  @PrimaryGeneratedColumn()
  id_type_reglement: number;

  @Column({ type: 'varchar', length: 40, })
  type_reglement: string;

}
