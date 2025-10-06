// import { Caisse } from 'src/caisse/entities/caisse.entity';
// import { Compte } from 'src/comptes/entities/compte.entity';
// import { TypeReglement } from 'src/type_reglement/type_reglement.entity';
// import {
//   Column,
//   Entity,
//   JoinColumn,
//   ManyToOne,
//   PrimaryGeneratedColumn,
// } from 'typeorm';

// @Entity('depense')
// export class Depense {
//   @PrimaryGeneratedColumn()
//   id_depense: number;

//   @Column({ type: 'double' })
//   montant: number;

//   @Column({ type: 'varchar' })
//   date: string; // Keeping as string to match Compte's date format

//   @Column({ type: 'text', nullable: true })
//   description?: string;

//   @Column({ type: 'int', nullable: true })
//   id_type_reglement: number;

//   @ManyToOne(
//     () => TypeReglement,
//     (typeReglement) => typeReglement.id_type_reglement,
//     {
//       nullable: true,
//       onDelete: 'RESTRICT',
//     },
//   )
//   @JoinColumn({
//     name: 'id_type_reglement',
//     referencedColumnName: 'id_type_reglement',
//   })
//   typeReglement?: TypeReglement;

//   @ManyToOne(() => Compte, (compte) => compte.depenses, {
//     nullable: true,
//     onDelete: 'RESTRICT',
//   })
//   @JoinColumn({ name: 'id_compte' })
//   compte?: Compte;

//   @ManyToOne(() => Caisse, (caisse) => caisse.depenses, {
//     nullable: true,
//     onDelete: 'RESTRICT',
//   })
//   @JoinColumn({ name: 'id_caisse' })
//   caisse?: Caisse;
// }

import { Caisse } from 'src/caisse/entities/caisse.entity';
import { Compte } from 'src/comptes/entities/compte.entity';
import { TypeReglement } from 'src/type_reglement/type_reglement.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('depense')
export class Depense {
  @PrimaryGeneratedColumn()
  id_depense: number;

  @Column({ type: 'double' })
  montant: number;

  @Column({ type: 'varchar' })
  date: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true })
  id_type_reglement: number;

  @ManyToOne(
    () => TypeReglement,
    (typeReglement) => typeReglement.id_type_reglement,
    {
      nullable: true,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'id_type_reglement',
    referencedColumnName: 'id_type_reglement',
  })
  typeReglement?: TypeReglement;

  @Column({ type: 'int', nullable: true })
  id_compte?: number;

  @ManyToOne(() => Compte, (compte) => compte.depenses, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_compte' })
  compte?: Compte;

  @Column({ type: 'int', nullable: true })
  id_caisse?: number;

  @ManyToOne(() => Caisse, (caisse) => caisse.depenses, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_caisse' })
  caisse?: Caisse;
}
