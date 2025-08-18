import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('log')
export class Log {
  @PrimaryGeneratedColumn()
  id_log: number;

  @Column({ type: 'text', })
  log: string;

  @Column({ type: 'datetime', })
  date: Date;

  @Column({ type: 'varchar', length: 50, })
  user: string;

  @Column({ type: 'int', })
  archive: number;

}
