import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('receipt_type')
export class ReceiptType {
  @PrimaryGeneratedColumn()
  id_receipt_type: number;

  @Column({ type: 'varchar', length: 40, })
  receipt_type: string;

}
