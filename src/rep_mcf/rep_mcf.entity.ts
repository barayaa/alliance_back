import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('rep_mcf')
export class RepMcf {
  @PrimaryGeneratedColumn()
  id_rep_mcf: number;

  @Column({ type: 'varchar', length: 50, })
  counter_per_recommcoceipt_type: string;

  @Column({ type: 'varchar', length: 25, })
  total_receipt_counter: string;

  @Column({ type: 'varchar', length: 25, })
  receipt_type: string;

  @Column({ type: 'varchar', length: 25, })
  process_date_and_time: string;

  @Column({ type: 'varchar', length: 25, })
  device_dentification: string;

  @Column({ type: 'varchar', length: 25, })
  nif_mcf: string;

  @Column({ type: 'varchar', length: 25, })
  signature: string;

  @Column({ type: 'int', })
  id_commande_vente: number;

}
