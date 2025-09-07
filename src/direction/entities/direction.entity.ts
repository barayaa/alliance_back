import { Poste } from 'src/postes/entities/poste.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Direction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  // Relation One-to-Many avec Poste
  @OneToMany(() => Poste, (poste) => poste.direction)
  postes: Poste[];
}
