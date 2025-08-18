import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';

@Entity('type_mvt')
export class TypeMvt {
  @PrimaryGeneratedColumn()
  id_type_mvt: number;

  @Column({ type: 'varchar', length: 30 })
  type_mvt: string;

  @OneToMany(() => MMvtStock, (mouvement) => mouvement.typeMvt)
  mouvements: MMvtStock[];
}
