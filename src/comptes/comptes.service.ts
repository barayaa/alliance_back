import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCompteDto } from './dto/create-compte.dto';
import { UpdateCompteDto } from './dto/update-compte.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Compte } from './entities/compte.entity';
import { Repository } from 'typeorm';
import { Banque } from 'src/banques/entities/banque.entity';

@Injectable()
export class ComptesService {
  constructor(
    // Inject any necessary repositories or services here
    @InjectRepository(Compte)
    private readonly compteRepository: Repository<Compte>,
    @InjectRepository(Banque)
    private readonly banqueRepository: Repository<Banque>,
  ) {}

  findCompteByBanqueId(id_banque: number): Promise<Compte[]> {
    return this.compteRepository.find({
      where: { banque: { id_banque } },
      relations: ['banque'], // Charger la relation avec Banque
    });
  }

  async create(createCompteDto: CreateCompteDto): Promise<Compte> {
    // Vérifier les champs requis
    const { numero_compte, id_banque, solde, date_creation } = createCompteDto;
    if (!numero_compte || !id_banque || solde < 0 || !date_creation) {
      throw new BadRequestException(
        'numero_compte, id_banque, solde positif ou zéro, et date_creation sont requis',
      );
    }

    // Vérifier si la banque existe
    const banque = await this.banqueRepository.findOne({
      where: { id_banque },
    });
    if (!banque) {
      throw new NotFoundException(`Banque avec l'ID ${id_banque} non trouvée`);
    }

    // Vérifier l'unicité de numero_compte
    const existingCompte = await this.compteRepository.findOne({
      where: { numero_compte },
    });
    if (existingCompte) {
      throw new BadRequestException(
        `Le numéro de compte ${numero_compte} existe déjà`,
      );
    }

    // Créer le compte
    const compte = this.compteRepository.create({
      numero_compte,
      solde,
      date_creation,
      date_fermeture: createCompteDto.date_fermeture,
      banque, // Assigner l'entité Banque
    }); // Forcer le type Compte pour éviter Compte[]

    // Sauvegarder le compte
    try {
      return await this.compteRepository.save(compte);
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
      throw new BadRequestException('Erreur lors de la création du compte');
    }
  }

  findAll() {
    return this.compteRepository.find({
      relations: ['banque'], // Charger la relation avec Banque
    });
  }

  findOne(id: number) {
    return this.compteRepository
      .findOne({
        where: { id_compte: id },
        relations: ['banque'], // Charger la relation avec Banque
      })
      .then((compte) => {
        if (!compte) {
          throw new NotFoundException(`Compte avec l'ID ${id} non trouvé`);
        }
        return compte;
      });
  }

  update(id: number, updateCompteDto: UpdateCompteDto) {
    return this.compteRepository
      .findOne({ where: { id_compte: id } })
      .then((compte) => {
        if (!compte) {
          throw new NotFoundException(`Compte avec l'ID ${id} non trouvé`);
        }

        // Mettre à jour les champs du compte
        Object.assign(compte, updateCompteDto);

        // Sauvegarder le compte mis à jour
        return this.compteRepository.save(compte);
      });
  }

  remove(id: number) {
    return this.compteRepository
      .delete(id)
      .then((result) => {
        if (result.affected === 0) {
          throw new NotFoundException(`Compte avec l'ID ${id} non trouvé`);
        }
        return { message: `Compte avec l'ID ${id} supprimé avec succès` };
      })
      .catch((error) => {
        console.error('Erreur lors de la suppression du compte:', error);
        throw new BadRequestException(
          'Erreur lors de la suppression du compte',
        );
      });
  }
}
