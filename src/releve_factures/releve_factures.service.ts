import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReleveFactures } from './releve_factures.entity';
import { CreateReleveFacturesDto } from './dto/create-releve_factures.dto';
import { UpdateReleveFacturesDto } from './dto/update-releve_factures.dto';
import { GetUnpaidInvoicesDto } from 'src/commande_vente/dto/invoice-unpaid.dto';

@Injectable()
export class ReleveFacturesService {
  constructor(
    @InjectRepository(ReleveFactures)
    private releve_facturesRepository: Repository<ReleveFactures>,
  ) {}

  async findAll(): Promise<ReleveFactures[]> {
    return this.releve_facturesRepository.find();
  }

  async findOne(id: number): Promise<ReleveFactures> {
    const entity = await this.releve_facturesRepository.findOne({
      where: { id_releve_factures: id },
    });
    if (!entity) throw new NotFoundException('ReleveFactures not found');
    return entity;
  }

  async create(dto: CreateReleveFacturesDto): Promise<ReleveFactures> {
    const entity = this.releve_facturesRepository.create(dto);
    return this.releve_facturesRepository.save(entity);
  }

  async update(
    id: number,
    dto: UpdateReleveFacturesDto,
  ): Promise<ReleveFactures> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.releve_facturesRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.releve_facturesRepository.remove(entity);
  }

  async getUnpaidInvoices(dto: GetUnpaidInvoicesDto) {
    const { id_client, date_debut, date_fin } = dto;

    if (!id_client) {
      throw new BadRequestException("L'ID du client est requis");
    }

    // Construire la requête
    const query = this.releve_facturesRepository
      .createQueryBuilder('releve')
      .where('releve.id_client = :id_client', { id_client })
      .andWhere('releve.reglee = :reglee', { reglee: 0 });

    // Ajouter le filtre par dates si fourni
    if (date_debut && date_fin) {
      query.andWhere('releve.date_emission BETWEEN :date_debut AND :date_fin', {
        date_debut,
        date_fin,
      });
    } else if (date_debut) {
      query.andWhere('releve.date_emission >= :date_debut', { date_debut });
    } else if (date_fin) {
      query.andWhere('releve.date_emission <= :date_fin', { date_fin });
    }

    // Récupérer les factures avec les relations nécessaires
    const invoices = await query
      .leftJoinAndSelect('releve.client', 'client')
      .select([
        'releve.id_releve_factures',
        'releve.numeros_factures',
        'releve.date_emission',
        'releve.dernier_delai',
        'releve.reglee',
        'client.nom',
        'client.prenom',
      ])
      .orderBy('releve.date_emission', 'DESC')
      .getMany();

    return invoices;
  }
}
