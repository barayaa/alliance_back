import { Depense } from 'src/depense/entities/depense.entity';
import { MouvementNita } from 'src/mouvement_nita/entities/mouvement_nita.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Nita {
  @PrimaryGeneratedColumn()
  id_nita: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  nom: string;

  @Column({ type: 'double', default: 0 })
  solde: number;

  @OneToMany(() => Depense, (depense) => depense.nita)
  depenses: Depense[];

  @OneToMany(() => MouvementNita, (mouvement) => mouvement.nita)
  mouvements: MouvementNita[];
}
