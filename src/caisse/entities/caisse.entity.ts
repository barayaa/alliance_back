import { Depense } from 'src/depense/entities/depense.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
@Entity('caisse')
export class Caisse {
  @PrimaryGeneratedColumn()
  id_caisse: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  nom: string;

  @OneToMany(() => Depense, (depense) => depense.caisse)
  depenses: Depense[];

  @Column({ type: 'double', default: 0 })
  solde: number;
}
