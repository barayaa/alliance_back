import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('type_stat')
export class TypeStat {
  @PrimaryGeneratedColumn()
  id_type_stat: number;

  @Column({ type: 'varchar', length: 40, })
  type_stat: string;

}
