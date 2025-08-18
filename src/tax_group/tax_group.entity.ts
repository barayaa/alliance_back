import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('tax_group')
export class TaxGroup {
  @PrimaryGeneratedColumn()
  id_tax_group: number;

  @Column({ type: 'varchar', length: 1, })
  tax_group: string;

  @Column({ type: 'varchar', length: 5, })
  etiquette: string;

  @Column({ type: 'varchar', length: 5, })
  taux: string;

  @Column({ type: 'varchar', length: 50, })
  description: string;

  @Column({ type: 'varchar', length: 50, })
  observation: string;

}
