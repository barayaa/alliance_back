import { Compte } from 'src/comptes/entities/compte.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('banque')
export class Banque {
  @PrimaryGeneratedColumn()
  id_banque: number;

  @Column()
  nom: string;

  @OneToMany(() => Compte, (compte) => compte.banque)
  comptes: Compte[];

  @Column()
  addresse: string;

  @Column()
  telephone: string;

  @Column()
  email: string;
}
