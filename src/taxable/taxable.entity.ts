import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('taxable')
export class Taxable {
  @PrimaryGeneratedColumn()
  id_taxable: number;

  @Column({ type: 'varchar', length: 5, })
  taxable: string;

}
