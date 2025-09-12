import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Role } from './enums/role.enum';
import { Poste } from 'src/postes/entities/poste.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id_user: number;

  @Column({ type: 'varchar', length: 25 })
  nom: string;

  @Column({ type: 'varchar', length: 25 })
  prenom: string;

  @Column({ type: 'varchar', length: 35 })
  email: string;

  @Column({ type: 'varchar', length: 25, unique: true })
  login: string;

  @Column({ type: 'varchar', length: 225 })
  password: string;

  // @Column({ type: 'int', nullable: true })
  // password_status?: number;

  @Column({ type: 'int', nullable: true })
  profil: number;

  @Column({ type: 'int', name: 'poste', nullable: true })
  poste: number;

  @ManyToOne(() => Poste, (poste) => poste.users, { nullable: true })
  @JoinColumn({ name: 'poste' }) // Lier explicitement à la colonne poste
  posteEntity: Poste;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.Regular,
  })
  role: Role;

  @Column({ type: 'varchar', length: 25 })
  telephone: string;
}
