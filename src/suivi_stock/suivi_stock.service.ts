import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuiviStock } from './suivi_stock.entity';
import { CreateSuiviStockDto } from './dto/create-suivi_stock.dto';
import { UpdateSuiviStockDto } from './dto/update-suivi_stock.dto';
import * as XLSX from 'xlsx';
import { Buffer } from 'buffer';

@Injectable()
export class SuiviStockService {
  constructor(
    @InjectRepository(SuiviStock)
    private suivi_stockRepository: Repository<SuiviStock>,
  ) {}

  // async findAll(
  //   searchTerm?: string,
  //   date?: string,
  //   dateDebut?: string,
  //   dateFin?: string,
  // ): Promise<SuiviStock[]> {
  //   console.log('findAll params:', { searchTerm, date, dateDebut, dateFin }); // Log pour déboguer

  //   let query = this.suivi_stockRepository
  //     .createQueryBuilder('suivi_stock')
  //     .leftJoinAndSelect('suivi_stock.produit', 'produit')
  //     .orderBy('suivi_stock.date_print', 'DESC');

  //   // Filtre par recherche textuelle
  //   if (searchTerm && searchTerm.trim() !== '') {
  //     const searchLower = `%${searchTerm.toLowerCase()}%`;
  //     query = query.andWhere('LOWER(produit.produit) LIKE :search', {
  //       search: searchLower,
  //     });
  //   }

  //   // Filtre par date spécifique
  //   if (date && date !== 'NaN' && date.trim() !== '') {
  //     query = query.andWhere('DATE(suivi_stock.date_print) = :date', { date });
  //   }
  //   // Filtre par plage de dates (si pas de date spécifique)
  //   else if (
  //     dateDebut &&
  //     dateFin &&
  //     dateDebut !== 'NaN' &&
  //     dateFin !== 'NaN' &&
  //     dateDebut.trim() !== '' &&
  //     dateFin.trim() !== ''
  //   ) {
  //     query = query.andWhere(
  //       'suivi_stock.date_print BETWEEN :dateDebut AND :dateFin',
  //       { dateDebut, dateFin },
  //     );
  //   } else if (dateDebut && dateDebut !== 'NaN' && dateDebut.trim() !== '') {
  //     query = query.andWhere('suivi_stock.date_print >= :dateDebut', {
  //       dateDebut,
  //     });
  //   } else if (dateFin && dateFin !== 'NaN' && dateFin.trim() !== '') {
  //     query = query.andWhere('suivi_stock.date_print <= :dateFin', { dateFin });
  //   }

  //   const queryString = query.getSql();
  //   console.log('Generated SQL:', queryString); // Log pour déboguer la requête SQL
  //   const result = await query.getMany();
  //   console.log('findAll result:', result); // Log pour déboguer
  //   return result;
  // }

  // async findAllForExport(
  //   searchTerm?: string,
  //   date?: string,
  //   dateDebut?: string,
  //   dateFin?: string,
  // ): Promise<SuiviStock[]> {
  //   return this.findAll(searchTerm, date, dateDebut, dateFin);
  // }

  async findAll(
    searchTerm?: string,
    date?: string,
    dateDebut?: string,
    dateFin?: string,
  ): Promise<any[]> {
    console.log('findAll params:', { searchTerm, date, dateDebut, dateFin });

    let query = this.suivi_stockRepository
      .createQueryBuilder('suivi_stock')
      .leftJoinAndSelect('suivi_stock.produit', 'produit')
      .leftJoinAndSelect('produit.marque', 'marque')
      .leftJoinAndSelect('produit.forme', 'forme')
      .select([
        'suivi_stock.id_suivi_stock AS id_suivi_stock',
        'suivi_stock.date_print AS date_print',
        'suivi_stock.entree AS entree',
        'suivi_stock.sortie AS sortie',
        'suivi_stock.stock AS stock',
        'produit.id_produit AS id_produit',
        'produit.produit AS designation',
        'produit.dosage AS dosage',
        'produit.presentation AS presentation',
        'produit.prix_unitaire AS prix_unitaire',
        'produit.stock_min AS stock_minimum',
        'marque.marque AS marque',
        'forme.forme AS forme',
      ])
      .orderBy('suivi_stock.date_print', 'DESC');

    if (searchTerm && searchTerm.trim() !== '') {
      const searchLower = `%${searchTerm.toLowerCase()}%`;
      query = query.andWhere('LOWER(produit.produit) LIKE :search', {
        search: searchLower,
      });
    }

    if (date && date !== 'NaN' && date.trim() !== '') {
      query = query.andWhere('DATE(suivi_stock.date_print) = :date', { date });
    } else if (
      dateDebut &&
      dateFin &&
      dateDebut !== 'NaN' &&
      dateFin !== 'NaN' &&
      dateDebut.trim() !== '' &&
      dateFin.trim() !== ''
    ) {
      query = query.andWhere(
        'suivi_stock.date_print BETWEEN :dateDebut AND :dateFin',
        { dateDebut, dateFin },
      );
    } else if (dateDebut && dateDebut !== 'NaN' && dateDebut.trim() !== '') {
      query = query.andWhere('suivi_stock.date_print >= :dateDebut', {
        dateDebut,
      });
    } else if (dateFin && dateFin !== 'NaN' && dateFin.trim() !== '') {
      query = query.andWhere('suivi_stock.date_print <= :dateFin', { dateFin });
    }

    const queryString = query.getSql();
    console.log('Generated SQL:', queryString);
    const result = await query.getRawMany();
    console.log('Raw result (first 5):', result.slice(0, 5));

    const mappedResult = result.map((item) => ({
      id_suivi_stock: item.id_suivi_stock,
      id_produit: item.id_produit,
      designation: item.designation || 'N/A',
      marque: item.marque || 'N/A',
      dosage: item.dosage || 'N/A',
      forme: item.forme || 'N/A',
      presentation: item.presentation || 'N/A',
      stock_minimum: Number(item.stock_minimum) || 0,
      latest_stock: Number(item.stock) || 0,
      prix_unitaire: Number(item.prix_unitaire) || 0,
      value: (Number(item.stock) || 0) * (Number(item.prix_unitaire) || 0),
      latest_date: item.date_print
        ? new Date(item.date_print).toISOString().split('T')[0]
        : null,
      entree: Number(item.entree) || 0,
      sortie: Number(item.sortie) || 0,
    }));

    console.log('Mapped result (first 5):', mappedResult.slice(0, 5));
    return mappedResult;
  }

  async findAllForExport(
    searchTerm?: string,
    date?: string,
    dateDebut?: string,
    dateFin?: string,
  ): Promise<any[]> {
    return this.findAll(searchTerm, date, dateDebut, dateFin);
  }

  async findOne(id: number): Promise<SuiviStock> {
    const entity = await this.suivi_stockRepository.findOne({
      where: { id_suivi_stock: id },
      relations: ['produit'],
    });
    if (!entity) throw new NotFoundException('SuiviStock not found');
    return entity;
  }

  async create(dto: CreateSuiviStockDto): Promise<SuiviStock> {
    const entity = this.suivi_stockRepository.create(dto);
    return this.suivi_stockRepository.save(entity);
  }

  async update(id: number, dto: UpdateSuiviStockDto): Promise<SuiviStock> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.suivi_stockRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.suivi_stockRepository.remove(entity);
  }

  async exportToExcel(
    searchTerm?: string,
    date?: string,
    dateDebut?: string,
    dateFin?: string,
  ): Promise<Buffer> {
    console.log('exportToExcel params:', {
      searchTerm,
      date,
      dateDebut,
      dateFin,
    }); // Log pour déboguer
    const suiviStocks = await this.findAllForExport(
      searchTerm,
      date,
      dateDebut,
      dateFin,
    );

    const data = suiviStocks.map((suivi: any) => ({
      ID: suivi.id_suivi_stock,
      Produit: suivi.produit?.produit || '-',
      Présentation: suivi.produit?.presentation || '-',
      Date:
        typeof suivi.date_print === 'string'
          ? suivi.date_print.split('T')[0]
          : new Date(suivi.date_print).toISOString().split('T')[0],
      Entrée: suivi.entree,
      Sortie: suivi.sortie,
      Stock: suivi.stock,
    }));

    console.log('exportToExcel data:', data); // Log pour déboguer
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suivi Stocks');
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    });

    return excelBuffer;
  }
}
