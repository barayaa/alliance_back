import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepenseDto } from './dto/create-depense.dto';
import { UpdateDepenseDto } from './dto/update-depense.dto';
import { Depense } from './entities/depense.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Caisse } from 'src/caisse/entities/caisse.entity';
import { Compte } from 'src/comptes/entities/compte.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DepenseService {
  constructor(
    @InjectRepository(Depense)
    private depenseRepository: Repository<Depense>,
    @InjectRepository(Compte)
    private compteRepository: Repository<Compte>,
    @InjectRepository(Caisse)
    private caisseRepository: Repository<Caisse>,
  ) {}

  async create(createDepenseDto: CreateDepenseDto): Promise<Depense> {
    const { montant, id_compte, id_caisse } = createDepenseDto;

    if (!id_compte && !id_caisse) {
      throw new BadRequestException(
        'Must provide either id_compte or id_caisse',
      );
    }
    if (id_compte && id_caisse) {
      throw new BadRequestException(
        'Cannot provide both id_compte and id_caisse',
      );
    }

    const depense = this.depenseRepository.create(createDepenseDto);

    if (id_compte) {
      const compte = await this.compteRepository.findOneBy({ id_compte });
      if (!compte) {
        throw new BadRequestException('Compte not found');
      }
      compte.solde -= montant;
      await this.compteRepository.save(compte);
      depense.compte = compte;
    } else if (id_caisse) {
      const caisse = await this.caisseRepository.findOneBy({ id_caisse });
      if (!caisse) {
        throw new BadRequestException('Caisse not found');
      }
      caisse.solde -= montant;
      await this.caisseRepository.save(caisse);
      depense.caisse = caisse;
    }

    return this.depenseRepository.save(depense);
  }

  async findAll(): Promise<Depense[]> {
    return this.depenseRepository.find({
      relations: ['compte', 'caisse'],
    });
  }

  async findOne(id: number): Promise<Depense> {
    const depense = await this.depenseRepository.findOne({
      where: { id_depense: id },
      relations: ['compte', 'caisse'],
    });
    if (!depense) {
      throw new NotFoundException(`Depense #${id} not found`);
    }
    return depense;
  }

  async update(
    id: number,
    updateDepenseDto: UpdateDepenseDto,
  ): Promise<Depense> {
    const depense = await this.findOne(id);
    const { montant, id_compte, id_caisse } = updateDepenseDto;

    // Handle balance adjustments if montant, id_compte, or id_caisse changes
    if (
      montant !== undefined ||
      id_compte !== undefined ||
      id_caisse !== undefined
    ) {
      // Revert previous balance
      if (depense.compte) {
        const compte = await this.compteRepository.findOneBy({
          id_compte: depense.compte.id_compte,
        });
        compte.solde += depense.montant;
        await this.compteRepository.save(compte);
      } else if (depense.caisse) {
        const caisse = await this.caisseRepository.findOneBy({
          id_caisse: depense.caisse.id_caisse,
        });
        caisse.solde += depense.montant;
        await this.caisseRepository.save(caisse);
      }

      // Apply new balance
      if (id_compte || (depense.compte && id_compte !== undefined)) {
        const compte = await this.compteRepository.findOneBy({
          id_compte: id_compte || depense.compte.id_compte,
        });
        if (!compte) {
          throw new BadRequestException('Compte not found');
        }
        const newMontant = montant !== undefined ? montant : depense.montant;
        if (compte.solde < newMontant) {
          throw new BadRequestException('Insufficient balance in compte');
        }
        compte.solde -= newMontant;
        await this.compteRepository.save(compte);
        depense.compte = compte;
        depense.caisse = null;
      } else if (id_caisse || (depense.caisse && id_caisse !== undefined)) {
        const caisse = await this.caisseRepository.findOneBy({
          id_caisse: id_caisse || depense.caisse.id_caisse,
        });
        if (!caisse) {
          throw new BadRequestException('Caisse not found');
        }
        const newMontant = montant !== undefined ? montant : depense.montant;
        if (caisse.solde < newMontant) {
          throw new BadRequestException('Insufficient balance in caisse');
        }
        caisse.solde -= newMontant;
        await this.caisseRepository.save(caisse);
        depense.caisse = caisse;
        depense.compte = null;
      } else {
        throw new BadRequestException(
          'Must provide either id_compte or id_caisse',
        );
      }
    }

    Object.assign(depense, updateDepenseDto);
    return this.depenseRepository.save(depense);
  }

  async remove(id: number): Promise<void> {
    const depense = await this.findOne(id);

    // Revert balance before deletion
    if (depense.compte) {
      const compte = await this.compteRepository.findOneBy({
        id_compte: depense.compte.id_compte,
      });
      compte.solde += depense.montant;
      await this.compteRepository.save(compte);
    } else if (depense.caisse) {
      const caisse = await this.caisseRepository.findOneBy({
        id_caisse: depense.caisse.id_caisse,
      });
      caisse.solde += depense.montant;
      await this.caisseRepository.save(caisse);
    }

    await this.depenseRepository.delete(id);
  }
}
