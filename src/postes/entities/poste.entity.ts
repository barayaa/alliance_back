import { Direction } from 'src/direction/entities/direction.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Poste {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  // Relation Many-to-One avec Direction
  @ManyToOne(() => Direction, (direction) => direction.postes)
  direction: Direction;

  // Relation Many-to-Many avec Menu
  @ManyToMany(() => Menu, (menu) => menu.postes)
  @JoinTable()
  menus: Menu[];

  @OneToMany(() => User, (user) => user.poste)
  users: User[];
}
