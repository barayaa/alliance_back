import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('caisse')
export class Caisse {
  @PrimaryGeneratedColumn()
  id_caisse: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  nom: string;

  @Column({ type: 'double', default: 0 })
  solde: number;
}
