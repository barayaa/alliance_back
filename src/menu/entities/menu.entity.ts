import { Poste } from 'src/postes/entities/poste.entity';
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
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  path: string;

  @Column()
  title: string;

  @Column()
  iconType: string;

  @Column()
  iconTheme: string;

  @Column()
  icon: string;

  // Relation Many-to-Many avec Poste
  @ManyToMany(() => Poste, (poste) => poste.menus)
  @JoinTable()
  postes: Poste[];

  // Relation auto-référentielle pour les sous-menus
  @ManyToOne(() => Menu, (menu) => menu.submenus, { nullable: true })
  parent: Menu;

  @OneToMany(() => Menu, (menu) => menu.parent)
  submenus: Menu[];
}
