import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('entrees_deleted')
export class EntreesDeleted {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', })
  id_entrees_deleted: number;

  @Column({ type: 'varchar', length: 20, })
  date: string;

  @Column({ type: 'varchar', length: 40, })
  user: string;

}
