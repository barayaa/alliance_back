import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('invoices_deleted')
export class InvoicesDeleted {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', })
  id_invoices_deleted: number;

  @Column({ type: 'varchar', length: 20, })
  date: string;

  @Column({ type: 'varchar', length: 40, })
  user: string;

}
