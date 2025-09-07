import { Poste } from 'src/postes/entities/poste.entity';
import { Column, OneToMany } from 'typeorm';

export class CreateDirectionDto {
  nom: string;
}
