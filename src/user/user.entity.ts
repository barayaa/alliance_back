import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Role } from './enums/role.enum';

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

  @Column({ type: 'int' })
  password_status?: number;

  @Column({ type: 'int' })
  profil: number;

  @Column({ type: 'varchar', length: 25 })
  poste: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.Regular,
  })
  role: Role;

  @Column({ type: 'varchar', length: 25 })
  telephone: string;

  // @Column({ type: 'int' })
  // id_fonction: number;

  // @Column({ type: 'int' })
  // id_departement: number;

  // @Column({ type: 'int' })
  // id_service: number;

  @Column({ type: 'int' })
  id_direction: number;
}
