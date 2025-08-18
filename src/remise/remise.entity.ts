import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('remise')
export class Remise {
  @PrimaryGeneratedColumn()
  id_remise: number;

  @Column({ type: 'double', })
  remise: number;

  @Column({ type: 'varchar', length: 5, })
  description: string;

}
