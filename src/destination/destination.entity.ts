import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('destination')
export class Destination {
  @PrimaryGeneratedColumn()
  id_destination: number;

  @Column({ type: 'varchar', length: 30, })
  destination: string;

  @Column({ type: 'double', })
  pu_prime_transport: number;

}
