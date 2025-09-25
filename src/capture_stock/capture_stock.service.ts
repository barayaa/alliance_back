import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaptureStock } from './capture_stock.entity';
import { CreateCaptureStockDto } from './dto/create-capture_stock.dto';
import { UpdateCaptureStockDto } from './dto/update-capture_stock.dto';
import * as XLSX from 'xlsx';
import { Buffer } from 'buffer';
import { Produit } from '../produit/produit.entity';
import { MMvtStock } from '../m_mvt_stock/m_mvt_stock.entity';

@Injectable()
export class CaptureStockService {
  constructor(
    @InjectRepository(CaptureStock)
    private captureStockRepository: Repository<CaptureStock>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,

    @InjectRepository(MMvtStock)
    private mvtStockRepository: Repository<MMvtStock>,
  ) {}

  async findAll(): Promise<CaptureStock[]> {
    return this.captureStockRepository.find({
      relations: ['produit', 'produit.marque'],
    });
  }

  async findOne(id: number): Promise<CaptureStock> {
    if (!id || isNaN(id)) {
      throw new NotFoundException('Invalid ID provided');
    }
    const entity = await this.captureStockRepository.findOne({
      where: { id },
      relations: ['produit', 'produit.marque'],
    });
    if (!entity)
      throw new NotFoundException(`Capture stock with ID ${id} not found`);
    return entity;
  }

  async create(createDto: CreateCaptureStockDto): Promise<CaptureStock> {
    const entity = this.captureStockRepository.create(createDto);
    return this.captureStockRepository.save(entity);
  }

  async updateStockCapture(idProduit: number, newStock: number): Promise<void> {
    // Vérifier s'il existe déjà une capture à cette date précise
    const latestCapture = await this.captureStockRepository
      .createQueryBuilder('cs')
      .where('cs.id_produit = :id', { id: idProduit })
      .orderBy('cs.date_capture', 'DESC')
      .getOne();

    if (!latestCapture || latestCapture.stock_courant !== newStock) {
      const capture = this.captureStockRepository.create({
        id_produit: idProduit,
        stock_courant: newStock,
        date_capture: new Date(),
      });
      await this.captureStockRepository.save(capture);
      console.log(
        `Capture mise à jour pour id_produit ${idProduit}: stock_courant = ${newStock}`,
      );
    } else {
      console.log(
        `Capture existante pour id_produit ${idProduit} avec même stock, pas de mise à jour`,
      );
    }
  }

  async remove(id: number): Promise<void> {
    if (!id || isNaN(id)) {
      throw new NotFoundException('Invalid ID provided');
    }
    await this.captureStockRepository.delete(id);
  }

  async findStockState(date?: string): Promise<any[]> {
    console.log('findStockState params:', { date });

    const targetDate =
      date && !isNaN(new Date(date).getTime()) ? new Date(date) : new Date();
    const dateEnd = new Date(targetDate);
    dateEnd.setDate(targetDate.getDate() + 1);

    // Récupérer tous les produits avec leur dernier stock avant la date
    const query = this.produitRepository
      .createQueryBuilder('produit')
      .leftJoinAndSelect(
        'produit.captureStocks',
        'capture_stock',
        'capture_stock.date_capture <= :dateEnd',
        { dateEnd: dateEnd.toISOString() },
      )
      .leftJoinAndSelect('produit.marque', 'marque')
      .leftJoinAndSelect('produit.forme', 'forme')
      .orderBy('capture_stock.date_capture', 'DESC')
      .addOrderBy('produit.id_produit', 'ASC');

    const products = await query.getMany();

    const result = products.map((produit: any) => {
      // Trouver le dernier capture_stock pour ce produit
      const latestStock =
        produit.captureStocks && produit.captureStocks.length > 0
          ? produit.captureStocks.reduce((latest: any, current: any) =>
              new Date(current.date_capture) > new Date(latest.date_capture)
                ? current
                : latest,
            )
          : null;

      const stockValue = latestStock
        ? latestStock.stock_courant * (produit.prix_unitaire || 0)
        : 0;
      const alert =
        latestStock && latestStock.stock_courant <= 10
          ? 'Seuil de sécurité atteint'
          : '';
      return {
        id_produit: produit.id_produit,
        designation: produit.produit ?? '-',
        brand: produit.marque?.marque ?? '-',
        dosage: produit.dosage ?? '-',
        form: produit.forme?.forme ?? '-',
        presentation: produit.presentation ?? '-',
        stock: latestStock ? latestStock.stock_courant : 0,
        value: stockValue,
        alert,
      };
    });

    console.log('findStockState result:', result);
    return result;
  }

  async getStockStateByDate(date?: string): Promise<any> {
    // Déterminer la date cible
    const targetDate = date ? new Date(date) : new Date();
    if (isNaN(targetDate.getTime())) {
      throw new BadRequestException('Date invalide.');
    }
    targetDate.setHours(0, 0, 0, 0);

    // Trouver la dernière date de capture avant ou à la date cible
    const latestCapture = await this.captureStockRepository
      .createQueryBuilder('cs')
      .select('MAX(cs.date_capture)', 'latest_date')
      .where('cs.date_capture <= :targetDate', {
        targetDate: targetDate.toISOString(),
      })
      .getRawOne();

    if (!latestCapture || !latestCapture.latest_date) {
      return { items: [], totalValue: 0 }; // Aucun stock trouvé
    }

    const latestDate = new Date(latestCapture.latest_date);
    const nextDate = new Date(latestDate);
    nextDate.setDate(latestDate.getDate() + 1);

    // Récupérer l'état du stock pour la dernière date trouvée
    const products = await this.captureStockRepository
      .createQueryBuilder('cs')
      .leftJoin('cs.produit', 'produit')
      .leftJoin('produit.marque', 'marque')
      .leftJoin('produit.forme', 'forme')
      .select([
        'produit.id_produit AS produit_id_produit',
        'produit.produit AS produit',
        'produit.dosage AS produit_dosage',
        'produit.presentation AS produit_presentation',
        'produit.prix_unitaire AS produit_prix_unitaire',
        'marque.marque AS marque',
        'forme.forme AS forme',
        'cs.stock_courant AS latest_stock',
        'cs.date_capture AS latest_date',
      ])
      .where('cs.date_capture >= :startDate AND cs.date_capture < :endDate', {
        startDate: latestDate.toISOString(),
        endDate: nextDate.toISOString(),
      })
      .orderBy('cs.date_capture', 'DESC')
      .groupBy('produit.id_produit')
      .addGroupBy('cs.stock_courant')
      .addGroupBy('cs.date_capture')
      .addGroupBy('produit.produit')
      .addGroupBy('produit.dosage')
      .addGroupBy('produit.presentation')
      .addGroupBy('produit.prix_unitaire')
      .addGroupBy('marque.marque')
      .addGroupBy('forme.forme')
      .getRawMany();

    const items = products.map((item) => ({
      id_produit: item.produit_id_produit,
      designation: item.produit || 'N/A',
      marque: item.marque || 'N/A',
      dosage: item.produit_dosage || 'N/A',
      forme: item.forme || 'N/A',
      presentation: item.produit_presentation || 'N/A',
      latest_stock: item.latest_stock || 0,
      prix_unitaire: item.produit_prix_unitaire || 0,
      value: (item.latest_stock || 0) * (item.produit_prix_unitaire || 0),
      latest_date: item.latest_date,
    }));

    return {
      items,
      totalValue: items.reduce((sum, item) => sum + item.value, 0),
      date: latestDate.toISOString().split('T')[0], // Retourner la date utilisée
    };
  }

  // async getStockStateByDate(date?: string): Promise<any> {
  //   const targetDate = date ? new Date(date) : new Date();
  //   targetDate.setHours(0, 0, 0, 0);
  //   const nextDate = new Date(targetDate);
  //   nextDate.setDate(targetDate.getDate() + 1);

  //   const products = await this.captureStockRepository
  //     .createQueryBuilder('cs')
  //     .leftJoin('cs.produit', 'produit')
  //     .leftJoin('produit.marque', 'marque')
  //     .leftJoin('produit.forme', 'forme')
  //     .select([
  //       'produit.id_produit AS produit_id_produit',
  //       'produit.produit AS produit',
  //       'produit.dosage AS produit_dosage',
  //       'produit.presentation AS produit_presentation',
  //       'produit.prix_unitaire AS produit_prix_unitaire',
  //       'marque.marque AS marque',
  //       'forme.forme AS forme',
  //       'cs.stock_courant AS latest_stock',
  //       'cs.date_capture AS latest_date',
  //     ])
  //     .where('cs.date_capture >= :startDate AND cs.date_capture < :endDate', {
  //       startDate: targetDate.toISOString(),
  //       endDate: nextDate.toISOString(),
  //     })
  //     .orderBy('cs.date_capture', 'DESC') // Trie par date décroissante
  //     .groupBy('produit.id_produit') // Regroupe par produit pour éviter les doublons
  //     .addGroupBy('cs.stock_courant') // Ajoute les champs nécessaires au GROUP BY
  //     .addGroupBy('cs.date_capture')
  //     .addGroupBy('produit.produit')
  //     .addGroupBy('produit.dosage')
  //     .addGroupBy('produit.presentation')
  //     .addGroupBy('produit.prix_unitaire')
  //     .addGroupBy('marque.marque')
  //     .addGroupBy('forme.forme')
  //     .getRawMany();

  //   const items = products.map((item) => ({
  //     id_produit: item.produit_id_produit,
  //     designation: item.produit || 'N/A',
  //     marque: item.marque || 'N/A',
  //     dosage: item.produit_dosage || 'N/A',
  //     forme: item.forme || 'N/A',
  //     presentation: item.produit_presentation || 'N/A',
  //     latest_stock: item.latest_stock || 0,
  //     prix_unitaire: item.produit_prix_unitaire || 0,
  //     value: (item.latest_stock || 0) * (item.produit_prix_unitaire || 0),
  //     latest_date: item.latest_date,
  //   }));

  //   return {
  //     items,
  //     totalValue: items.reduce((sum, item) => sum + item.value, 0),
  //   };
  // }

  async exportStockStateToExcel(date?: string): Promise<Buffer> {
    console.log('exportStockStateToExcel params:', { date });
    const stocks = await this.getStockStateByDate(date);
    console.log('Raw stocks:', stocks);

    const data = stocks.items.map((stock: any) => ({
      Désignation: stock.produit?.produit || '-', // À ajuster si produit est chargé
      Marque: stock.produit?.marque?.marque || '-',
      Stock: stock.latest_stock,
      'Valeur (FCA)': stock.value,
    }));

    console.log('exportStockStateToExcel data:', data);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Etat Stock');
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    });

    return excelBuffer;
  }
}
