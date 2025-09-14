import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MMvtStock } from './m_mvt_stock.entity';
import * as XLSX from 'xlsx';
import { Buffer } from 'buffer';
import { Produit } from '../produit/produit.entity';
import { CaptureStock } from '../capture_stock/capture_stock.entity';
import { TitulaireAmm } from '../titulaire_amm/titulaire_amm.entity';
import { CreateMMvtStockDto } from './dto/create-m_mvt_stock.dto';
import { CreateEntreeStockDto } from './dto/create-entree-stock.dto';
import { User } from '../user/user.entity';

@Injectable()
export class MMvtStockService {
  constructor(
    @InjectRepository(MMvtStock)
    private mMvtStockRepository: Repository<MMvtStock>,
    @InjectRepository(Produit)
    private produitRepository: Repository<Produit>,
    @InjectRepository(CaptureStock)
    private captureStockRepository: Repository<CaptureStock>,
    @InjectRepository(TitulaireAmm)
    private titulaireAmmRepository: Repository<TitulaireAmm>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // async findAll(
  //   searchTerm?: string,
  //   dateDebut?: string,
  //   dateFin?: string,
  //   typeMvt?: string,
  //   produitId?: string,
  // ): Promise<any[]> {
  //   console.log('findAll params:', {
  //     searchTerm,
  //     dateDebut,
  //     dateFin,
  //     typeMvt,
  //     produitId,
  //   });

  //   let query = this.mMvtStockRepository
  //     .createQueryBuilder('m_mvt_stock')
  //     .leftJoinAndSelect('m_mvt_stock.produit', 'produit')
  //     .leftJoinAndSelect('produit.marque', 'marque')
  //     .leftJoinAndSelect('produit.titulaire_amm', 'titulaire_amm')
  //     .leftJoinAndSelect('m_mvt_stock.typeMvt', 'typeMvt')
  //     .leftJoinAndSelect('m_mvt_stock.ligneCommandeVente', 'ligneCommandeVente')
  //     .leftJoinAndSelect('ligneCommandeVente.commandeVente', 'commandeVente')
  //     .leftJoin('commandeVente.client', 'client')
  //     .addSelect(['client.id_client', 'client.nom'])
  //     .orderBy('m_mvt_stock.id_mouvement', 'DESC');

  //   // Filtre par défaut pour l'année 2025
  //   query = query.andWhere('YEAR(m_mvt_stock.date) = :year', { year: 2025 });

  //   // Surcharge avec dateDebut et dateFin si fournis
  //   if (
  //     dateDebut &&
  //     dateFin &&
  //     dateDebut !== 'NaN' &&
  //     dateFin !== 'NaN' &&
  //     dateDebut.trim() !== '' &&
  //     dateFin.trim() !== ''
  //   ) {
  //     const dateFinEnd = new Date(
  //       new Date(dateFin).setDate(new Date(dateFin).getDate() + 1),
  //     )
  //       .toISOString()
  //       .split('T')[0];
  //     query = query.andWhere(
  //       'm_mvt_stock.date >= :dateDebut AND m_mvt_stock.date < :dateFinEnd',
  //       { dateDebut, dateFinEnd },
  //     );
  //   } else if (dateDebut && dateDebut !== 'NaN' && dateDebut.trim() !== '') {
  //     query = query.andWhere('m_mvt_stock.date >= :dateDebut', { dateDebut });
  //   } else if (dateFin && dateFin !== 'NaN' && dateFin.trim() !== '') {
  //     const dateFinEnd = new Date(
  //       new Date(dateFin).setDate(new Date(dateFin).getDate() + 1),
  //     )
  //       .toISOString()
  //       .split('T')[0];
  //     query = query.andWhere('m_mvt_stock.date < :dateFinEnd', { dateFinEnd });
  //   }

  //   if (searchTerm && searchTerm.trim() !== '') {
  //     const searchLower = `%${searchTerm.toLowerCase()}%`;
  //     query = query.andWhere('LOWER(produit.produit) LIKE :search', {
  //       search: searchLower,
  //     });
  //   }

  //   if (typeMvt && typeMvt.trim() !== '') {
  //     query = query.andWhere('typeMvt.type_mvt = :typeMvt', { typeMvt });
  //   }

  //   if (produitId && produitId !== '0' && produitId.trim() !== '') {
  //     query = query.andWhere('m_mvt_stock.id_produit = :produitId', {
  //       produitId: Number(produitId),
  //     });
  //   }

  //   const queryString = query.getSql();
  //   console.log('Generated SQL:', queryString);
  //   let result = await query.getMany();
  //   console.log('findAll result (2025):', result);

  //   // Si aucun mouvement trouvé en 2025, récupérer le dernier mouvement historique
  //   if (result.length === 0 && produitId) {
  //     const lastMovement = await this.mMvtStockRepository
  //       .createQueryBuilder('m_mvt_stock')
  //       .leftJoinAndSelect('m_mvt_stock.produit', 'produit')
  //       .leftJoinAndSelect('produit.marque', 'marque')
  //       .leftJoinAndSelect('produit.titulaire_amm', 'titulaire_amm')
  //       .leftJoinAndSelect('m_mvt_stock.typeMvt', 'typeMvt')
  //       .leftJoinAndSelect(
  //         'm_mvt_stock.ligneCommandeVente',
  //         'ligneCommandeVente',
  //       )
  //       .leftJoinAndSelect('ligneCommandeVente.commandeVente', 'commandeVente')
  //       .leftJoin('commandeVente.client', 'client')
  //       .addSelect(['client.id_client', 'client.nom'])
  //       .where('m_mvt_stock.id_produit = :produitId', {
  //         produitId: Number(produitId),
  //       })
  //       .orderBy('m_mvt_stock.id_mouvement', 'DESC')
  //       .getOne();

  //     if (lastMovement) {
  //       result = [lastMovement];
  //       console.log('Last movement (historical) added:', lastMovement);
  //     }
  //   }

  //   const formattedResult = result.map((mvt: any) => {
  //     const mnt =
  //       mvt.quantite && mvt.produit?.prix_unitaire
  //         ? mvt.quantite * mvt.produit.prix_unitaire
  //         : 0;
  //     const tva =
  //       mnt && mvt.produit?.taux_tva ? mnt * (mvt.produit.taux_tva / 100) : 0;
  //     const mntTTC = mnt + tva;
  //     const clientFournisseur =
  //       mvt.typeMvt?.type_mvt === 'Vente'
  //         ? (mvt.ligneCommandeVente?.commandeVente?.client?.nom ?? '-')
  //         : (mvt.produit?.titulaire_amm?.titulaire_amm ?? '-');

  //     // Gestion du stock négatif
  //     const originalStockApres = mvt.stock_apres;
  //     const adjustedStockApres = Math.max(0, mvt.stock_apres);
  //     const hasStockOverdraw = mvt.stock_apres < 0;

  //     return {
  //       ...mvt,
  //       mnt,
  //       tva,
  //       mntTTC,
  //       clientFournisseur,
  //       stock_apres: adjustedStockApres,
  //       originalStockApres,
  //       hasStockOverdraw,
  //     };
  //   });

  //   return formattedResult;
  // }

  // async getAllStockMovements(date?: string): Promise<any> {
  //   const targetDate = date || new Date().toISOString().split('T')[0];
  //   console.log(`Recherche des mouvements jusqu'au ${targetDate}`);

  //   // Récupérer tous les mouvements groupés par id_produit jusqu'à la date
  //   const movements = await this.mMvtStockRepository
  //     .createQueryBuilder('mvt')
  //     .select([
  //       'mvt.id_produit',
  //       'MAX(mvt.date) AS latest_date',
  //       'mvt.stock_apres AS latest_stock',
  //     ])
  //     .where('mvt.date <= :date', { date: targetDate })
  //     .groupBy('mvt.id_produit')
  //     .addGroupBy('mvt.stock_apres')
  //     .getRawMany();

  //   const stockData = await Promise.all(
  //     movements.map(async (item) => {
  //       // Récupérer tous les mouvements détaillés pour ce produit avec jointure sur produit
  //       const allMovements = await this.mMvtStockRepository
  //         .createQueryBuilder('mvt')
  //         .leftJoin('mvt.produit', 'produit') // Jointure avec la table produit
  //         .where('mvt.id_produit = :id', { id: item.id_produit })
  //         .andWhere('mvt.date <= :date', { date: targetDate })
  //         .select([
  //           'mvt.id_produit',
  //           'mvt.date',
  //           'mvt.quantite',
  //           'mvt.stock_avant',
  //           'mvt.stock_apres',
  //           'produit.prix_unitaire', // Récupère prix_unitaire depuis produit
  //         ])
  //         .orderBy('mvt.date', 'ASC')
  //         .getRawMany();

  //       const latestStock = item.latest_stock || 0; // Stock final basé sur le dernier mouvement
  //       const value = latestStock * (allMovements[0]?.prix_unitaire || 0); // Valeur basée sur prix_unitaire

  //       return {
  //         id_produit: item.id_produit,
  //         latest_stock: latestStock,
  //         value,
  //         movements: allMovements, // Tous les mouvements avec détails
  //       };
  //     }),
  //   );

  //   const totalValue = stockData.reduce(
  //     (sum, item) => sum + (item.value || 0),
  //     0,
  //   );

  //   return {
  //     items: stockData,
  //     totalValue,
  //   };
  // }

  // async findAll(
  //   searchTerm?: string,
  //   dateDebut?: string,
  //   dateFin?: string,
  //   typeMvt?: string,
  //   produitId?: string,
  // ): Promise<any[]> {
  //   console.log('findAll params:', {
  //     searchTerm,
  //     dateDebut,
  //     dateFin,
  //     typeMvt,
  //     produitId,
  //   });

  //   let query = this.mMvtStockRepository
  //     .createQueryBuilder('m_mvt_stock')
  //     .leftJoinAndSelect('m_mvt_stock.produit', 'produit')
  //     .leftJoinAndSelect('produit.marque', 'marque')
  //     .leftJoinAndSelect('produit.titulaire_amm', 'titulaire_amm')
  //     .leftJoinAndSelect('m_mvt_stock.typeMvt', 'typeMvt')
  //     .leftJoinAndSelect('m_mvt_stock.ligneCommandeVente', 'ligneCommandeVente')
  //     .leftJoinAndSelect('ligneCommandeVente.commandeVente', 'commandeVente')
  //     .leftJoinAndSelect('commandeVente.client', 'client') // Relation complète avec client
  //     .addSelect(['client.id_client', 'client.nom', 'commandeVente.id_client']) // Ajout de id_client
  //     .orderBy('m_mvt_stock.id_mouvement', 'DESC');

  //   if (!dateDebut && !dateFin) {
  //     query = query.andWhere('YEAR(m_mvt_stock.date) = :currentYear', {
  //       currentYear: new Date().getFullYear(),
  //     });
  //   }

  //   if (searchTerm && searchTerm.trim() !== '') {
  //     const searchLower = `%${searchTerm.toLowerCase()}%`;
  //     query = query.andWhere('LOWER(produit.produit) LIKE :search', {
  //       search: searchLower,
  //     });
  //   }

  //   if (
  //     dateDebut &&
  //     dateFin &&
  //     dateDebut !== 'NaN' &&
  //     dateFin !== 'NaN' &&
  //     dateDebut.trim() !== '' &&
  //     dateFin.trim() !== ''
  //   ) {
  //     const dateFinEnd = new Date(
  //       new Date(dateFin).setDate(new Date(dateFin).getDate() + 1),
  //     )
  //       .toISOString()
  //       .split('T')[0];
  //     query = query.andWhere(
  //       'm_mvt_stock.date >= :dateDebut AND m_mvt_stock.date < :dateFinEnd',
  //       { dateDebut, dateFinEnd },
  //     );
  //   } else if (dateDebut && dateDebut !== 'NaN' && dateDebut.trim() !== '') {
  //     query = query.andWhere('m_mvt_stock.date >= :dateDebut', { dateDebut });
  //   } else if (dateFin && dateFin !== 'NaN' && dateFin.trim() !== '') {
  //     const dateFinEnd = new Date(
  //       new Date(dateFin).setDate(new Date(dateFin).getDate() + 1),
  //     )
  //       .toISOString()
  //       .split('T')[0];
  //     query = query.andWhere('m_mvt_stock.date < :dateFinEnd', { dateFinEnd });
  //   }

  //   if (typeMvt && typeMvt.trim() !== '') {
  //     query = query.andWhere('typeMvt.type_mvt = :typeMvt', { typeMvt });
  //   }

  //   if (produitId && produitId !== '0' && produitId.trim() !== '') {
  //     query = query.andWhere('m_mvt_stock.id_produit = :produitId', {
  //       produitId: Number(produitId),
  //     });
  //   }

  //   const queryString = query.getSql();
  //   console.log('Generated SQL:', queryString);
  //   const result = await query.getMany();
  //   console.log('findAll result:', result);

  //   const formattedResult = result.map((mvt: any) => {
  //     const mnt =
  //       mvt.quantite && mvt.produit?.prix_unitaire
  //         ? mvt.quantite * mvt.produit.prix_unitaire
  //         : 0;
  //     const tva =
  //       mnt && mvt.produit?.taux_tva ? mnt * (mvt.produit.taux_tva / 100) : 0;
  //     const mntTTC = mnt + tva;
  //     const clientFournisseur =
  //       mvt.typeMvt?.type_mvt === 'Vente'
  //         ? (mvt.commandeVente?.client?.nom ?? 'Inconnu')
  //         : (mvt.produit?.titulaire_amm?.titulaire_amm ?? '-');
  //     return {
  //       ...mvt,
  //       mnt,
  //       tva,
  //       mntTTC,
  //       clientFournisseur,
  //     };
  //   });

  //   return formattedResult;
  // }

  // async findAllForExport(
  //   searchTerm?: string,
  //   dateDebut?: string,
  //   dateFin?: string,
  //   typeMvt?: string,
  //   produitId?: string,
  // ): Promise<any[]> {
  //   const mouvements = await this.findAll(
  //     searchTerm,
  //     dateDebut,
  //     dateFin,
  //     typeMvt,
  //     produitId,
  //   );
  //   console.log('findAllForExport result:', mouvements);

  //   const formattedMouvements = mouvements.map((mvt: any) => {
  //     const mnt =
  //       mvt.quantite && mvt.produit?.prix_unitaire
  //         ? mvt.quantite * mvt.produit.prix_unitaire
  //         : 0;
  //     const tva =
  //       mnt && mvt.produit?.taux_tva ? mnt * (mvt.produit.taux_tva / 100) : 0;
  //     const mntTTC = mnt + tva;
  //     const clientFournisseur =
  //       mvt.typeMvt?.type_mvt === 'Vente'
  //         ? (mvt.commandeVente?.client?.nom ?? 'Inconnu')
  //         : (mvt.produit?.titulaire_amm?.titulaire_amm ?? '-');
  //     return {
  //       ...mvt,
  //       mnt,
  //       tva,
  //       mntTTC,
  //       clientFournisseur,
  //     };
  //   });

  //   return formattedMouvements;
  // }

  // finddTout() {
  //   return this.mMvtStockRepository.find({
  //     relations: ['produit', 'typeMvt', 'commandeVente'],
  //   });
  // }

  // async findAll(
  //   searchTerm?: string,
  //   dateDebut?: string,
  //   dateFin?: string,
  //   typeMvt?: string,
  //   produitId?: string,
  // ): Promise<any[]> {
  //   console.log('findAll params:', {
  //     searchTerm,
  //     dateDebut,
  //     dateFin,
  //     typeMvt,
  //     produitId,
  //   });

  //   let query = this.mMvtStockRepository
  //     .createQueryBuilder('m_mvt_stock')
  //     .leftJoinAndSelect('m_mvt_stock.produit', 'produit')
  //     .leftJoinAndSelect('produit.marque', 'marque')
  //     .leftJoinAndSelect('produit.titulaire_amm', 'titulaire_amm')
  //     .leftJoinAndSelect('m_mvt_stock.typeMvt', 'typeMvt')
  //     .leftJoinAndSelect('m_mvt_stock.ligneCommandeVente', 'ligneCommandeVente')
  //     .leftJoinAndSelect('ligneCommandeVente.commandeVente', 'commandeVente')
  //     .leftJoin('commandeVente.client', 'client')
  //     .addSelect(['client.id_client', 'client.nom']) // Sélectionner uniquement les colonnes nécessaires
  //     .orderBy('m_mvt_stock.id_mouvement', 'DESC');

  //   if (!dateDebut && !dateFin) {
  //     query = query.andWhere('YEAR(m_mvt_stock.date) = :currentYear', {
  //       currentYear: new Date().getFullYear(),
  //     });
  //   }

  //   if (searchTerm && searchTerm.trim() !== '') {
  //     const searchLower = `%${searchTerm.toLowerCase()}%`;
  //     query = query.andWhere('LOWER(produit.produit) LIKE :search', {
  //       search: searchLower,
  //     });
  //   }

  //   if (
  //     dateDebut &&
  //     dateFin &&
  //     dateDebut !== 'NaN' &&
  //     dateFin !== 'NaN' &&
  //     dateDebut.trim() !== '' &&
  //     dateFin.trim() !== ''
  //   ) {
  //     const dateFinEnd = new Date(
  //       new Date(dateFin).setDate(new Date(dateFin).getDate() + 1),
  //     )
  //       .toISOString()
  //       .split('T')[0];
  //     query = query.andWhere(
  //       'm_mvt_stock.date >= :dateDebut AND m_mvt_stock.date < :dateFinEnd',
  //       { dateDebut, dateFinEnd },
  //     );
  //   } else if (dateDebut && dateDebut !== 'NaN' && dateDebut.trim() !== '') {
  //     query = query.andWhere('m_mvt_stock.date >= :dateDebut', { dateDebut });
  //   } else if (dateFin && dateFin !== 'NaN' && dateFin.trim() !== '') {
  //     const dateFinEnd = new Date(
  //       new Date(dateFin).setDate(new Date(dateFin).getDate() + 1),
  //     )
  //       .toISOString()
  //       .split('T')[0];
  //     query = query.andWhere('m_mvt_stock.date < :dateFinEnd', { dateFinEnd });
  //   }

  //   if (typeMvt && typeMvt.trim() !== '') {
  //     query = query.andWhere('typeMvt.type_mvt = :typeMvt', { typeMvt });
  //   }

  //   if (produitId && produitId !== '0' && produitId.trim() !== '') {
  //     query = query.andWhere('m_mvt_stock.id_produit = :produitId', {
  //       produitId: Number(produitId),
  //     });
  //   }

  //   const queryString = query.getSql();
  //   console.log('Generated SQL:', queryString);
  //   const result = await query.getMany();
  //   console.log('findAll result:', result);

  //   const formattedResult = result.map((mvt: any) => {
  //     const mnt =
  //       mvt.quantite && mvt.produit?.prix_unitaire
  //         ? mvt.quantite * mvt.produit.prix_unitaire
  //         : 0;
  //     const tva =
  //       mnt && mvt.produit?.taux_tva ? mnt * (mvt.produit.taux_tva / 100) : 0;
  //     const mntTTC = mnt + tva;
  //     const clientFournisseur =
  //       mvt.typeMvt?.type_mvt === 'Vente'
  //         ? (mvt.ligneCommandeVente?.commandeVente?.client?.nom ?? '-')
  //         : (mvt.produit?.titulaire_amm?.titulaire_amm ?? '-');

  //     // Gestion du stock négatif
  //     const originalStockApres = mvt.stock_apres;
  //     const adjustedStockApres = Math.max(0, mvt.stock_apres); // Affiche 0 si négatif
  //     const hasStockOverdraw = mvt.stock_apres < 0; // Indicateur de dépassement

  //     return {
  //       ...mvt,
  //       mnt,
  //       tva,
  //       mntTTC,
  //       clientFournisseur,
  //       stock_apres: adjustedStockApres, // Remplace stock_apres par la valeur ajustée
  //       originalStockApres, // Garde la valeur originale pour référence si besoin
  //       hasStockOverdraw, // Ajoute un drapeau pour signaler le dépassement
  //     };
  //   });

  //   return formattedResult;
  // }

  // async findAll(
  //   searchTerm?: string,
  //   dateDebut?: string,
  //   dateFin?: string,
  //   typeMvt?: string,
  //   produitId?: string,
  // ): Promise<any[]> {
  //   console.log('findAll params:', {
  //     searchTerm,
  //     dateDebut,
  //     dateFin,
  //     typeMvt,
  //     produitId,
  //   });

  //   let query = this.mMvtStockRepository
  //     .createQueryBuilder('m_mvt_stock')
  //     .leftJoinAndSelect('m_mvt_stock.produit', 'produit')
  //     .leftJoinAndSelect('produit.marque', 'marque')
  //     .leftJoinAndSelect('produit.titulaire_amm', 'titulaire_amm')
  //     .leftJoinAndSelect('m_mvt_stock.typeMvt', 'typeMvt')
  //     .leftJoinAndSelect('m_mvt_stock.ligneCommandeVente', 'ligneCommandeVente')
  //     .leftJoinAndSelect('ligneCommandeVente.commandeVente', 'commandeVente')
  //     .leftJoin('commandeVente.client', 'client')
  //     .addSelect(['client.id_client', 'client.nom']) // Sélectionner uniquement les colonnes nécessaires
  //     .orderBy('m_mvt_stock.id_mouvement', 'DESC');

  //   if (!dateDebut && !dateFin) {
  //     query = query.andWhere('YEAR(m_mvt_stock.date) = :currentYear', {
  //       currentYear: new Date().getFullYear(),
  //     });
  //   }

  //   if (searchTerm && searchTerm.trim() !== '') {
  //     const searchLower = `%${searchTerm.toLowerCase()}%`;
  //     query = query.andWhere('LOWER(produit.produit) LIKE :search', {
  //       search: searchLower,
  //     });
  //   }

  //   if (
  //     dateDebut &&
  //     dateFin &&
  //     dateDebut !== 'NaN' &&
  //     dateFin !== 'NaN' &&
  //     dateDebut.trim() !== '' &&
  //     dateFin.trim() !== ''
  //   ) {
  //     const dateFinEnd = new Date(
  //       new Date(dateFin).setDate(new Date(dateFin).getDate() + 1),
  //     )
  //       .toISOString()
  //       .split('T')[0];
  //     query = query.andWhere(
  //       'm_mvt_stock.date >= :dateDebut AND m_mvt_stock.date < :dateFinEnd',
  //       { dateDebut, dateFinEnd },
  //     );
  //   } else if (dateDebut && dateDebut !== 'NaN' && dateDebut.trim() !== '') {
  //     query = query.andWhere('m_mvt_stock.date >= :dateDebut', { dateDebut });
  //   } else if (dateFin && dateFin !== 'NaN' && dateFin.trim() !== '') {
  //     const dateFinEnd = new Date(
  //       new Date(dateFin).setDate(new Date(dateFin).getDate() + 1),
  //     )
  //       .toISOString()
  //       .split('T')[0];
  //     query = query.andWhere('m_mvt_stock.date < :dateFinEnd', { dateFinEnd });
  //   }

  //   if (typeMvt && typeMvt.trim() !== '') {
  //     query = query.andWhere('typeMvt.type_mvt = :typeMvt', { typeMvt });
  //   }

  //   if (produitId && produitId !== '0' && produitId.trim() !== '') {
  //     query = query.andWhere('m_mvt_stock.id_produit = :produitId', {
  //       produitId: Number(produitId),
  //     });
  //   }

  //   const queryString = query.getSql();
  //   console.log('Generated SQL:', queryString);
  //   const result = await query.getMany();
  //   console.log('findAll result:', result);

  //   const formattedResult = result.map((mvt: any) => {
  //     const mnt =
  //       mvt.quantite && mvt.produit?.prix_unitaire
  //         ? mvt.quantite * mvt.produit.prix_unitaire
  //         : 0;
  //     const tva =
  //       mnt && mvt.produit?.taux_tva ? mnt * (mvt.produit.taux_tva / 100) : 0;
  //     const mntTTC = mnt + tva;
  //     const clientFournisseur =
  //       mvt.typeMvt?.type_mvt === 'Vente'
  //         ? (mvt.ligneCommandeVente?.commandeVente?.client?.nom ?? '-')
  //         : (mvt.produit?.titulaire_amm?.titulaire_amm ?? '-');
  //     return {
  //       ...mvt,
  //       mnt,
  //       tva,
  //       mntTTC,
  //       clientFournisseur,
  //     };
  //   });

  //   return formattedResult;
  // }

  async findAll(
    searchTerm?: string,
    dateDebut?: string,
    dateFin?: string,
    typeMvt?: string,
    produitId?: string,
  ): Promise<any[]> {
    console.log('findAll params:', {
      searchTerm,
      dateDebut,
      dateFin,
      typeMvt,
      produitId,
    });

    try {
      let query = this.mMvtStockRepository
        .createQueryBuilder('m_mvt_stock')
        .leftJoinAndSelect('m_mvt_stock.produit', 'produit')
        .leftJoinAndSelect('produit.marque', 'marque')
        .leftJoinAndSelect('produit.titulaire_amm', 'titulaire_amm')
        .leftJoinAndSelect('m_mvt_stock.typeMvt', 'typeMvt')
        .leftJoinAndSelect(
          'm_mvt_stock.ligneCommandeVente',
          'ligneCommandeVente',
        )
        .leftJoinAndSelect('ligneCommandeVente.commandeVente', 'commandeVente')
        .leftJoin('commandeVente.client', 'client')
        .addSelect(['client.id_client', 'client.nom'])
        .addSelect(
          'CASE WHEN m_mvt_stock.stock_apres != produit.stock_courant THEN 1 ELSE 0 END',
          'hasStockInconsistency',
        )
        .orderBy('m_mvt_stock.id_mouvement', 'DESC')
        .take(100); // Ajouter une limite pour éviter les surcharges

      // Filtre par plage de dates pour 2025
      query = query.andWhere(
        'm_mvt_stock.date BETWEEN :startYear AND :endYear',
        {
          startYear: '2025-01-01',
          endYear: '2025-12-31 23:59:59',
        },
      );

      // Surcharge avec dateDebut et dateFin
      if (dateDebut && !isNaN(Date.parse(dateDebut))) {
        if (dateFin && !isNaN(Date.parse(dateFin))) {
          const dateFinEnd = new Date(
            new Date(dateFin).setDate(new Date(dateFin).getDate() + 1),
          )
            .toISOString()
            .split('T')[0];
          query = query.andWhere(
            'm_mvt_stock.date BETWEEN :dateDebut AND :dateFinEnd',
            { dateDebut, dateFinEnd },
          );
        } else {
          query = query.andWhere('m_mvt_stock.date >= :dateDebut', {
            dateDebut,
          });
        }
      } else if (dateFin && !isNaN(Date.parse(dateFin))) {
        const dateFinEnd = new Date(
          new Date(dateFin).setDate(new Date(dateFin).getDate() + 1),
        )
          .toISOString()
          .split('T')[0];
        query = query.andWhere('m_mvt_stock.date < :dateFinEnd', {
          dateFinEnd,
        });
      }

      if (searchTerm && searchTerm.trim() !== '') {
        query = query.andWhere(
          'MATCH(produit.produit) AGAINST(:search IN BOOLEAN MODE)',
          {
            search: searchTerm,
          },
        );
      }

      if (typeMvt && typeMvt.trim() !== '') {
        query = query.andWhere('typeMvt.type_mvt = :typeMvt', { typeMvt });
      }

      if (produitId && !isNaN(Number(produitId)) && produitId !== '0') {
        query = query.andWhere('m_mvt_stock.id_produit = :produitId', {
          produitId: Number(produitId),
        });
      }

      const queryString = query.getSql();
      console.log('Generated SQL:', queryString);
      const result = await query.getMany();
      console.log('findAll result (2025):', result);

      const formattedResult = result.map((mvt) => ({
        ...mvt,
        mnt: mvt.quantite * (mvt.produit?.prix_unitaire || 0),
        tva:
          mvt.quantite *
          (mvt.produit?.prix_unitaire || 0) *
          (mvt.produit?.taux_tva / 100 || 0),
        mntTTC:
          mvt.quantite *
          (mvt.produit?.prix_unitaire || 0) *
          (1 + mvt.produit?.taux_tva / 100 || 0),
        clientFournisseur:
          mvt.typeMvt?.type_mvt === 'Vente'
            ? (mvt.ligneCommandeVente?.commandeVente?.client?.nom ?? '-')
            : (mvt.produit?.titulaire_amm?.titulaire_amm ?? '-'),
        stock_apres: Math.max(0, mvt.stock_apres),
        originalStockApres: mvt.stock_apres,
        hasStockOverdraw: mvt.stock_apres < 0,
      }));

      return formattedResult;
    } catch (error) {
      console.error(
        "Erreur lors de l'exécution de la requête:",
        error.message,
        error.stack,
      );
      throw new BadRequestException(
        'Erreur lors de la récupération des mouvements de stock',
      );
    }
  }

  // async findAll(
  //   searchTerm?: string,
  //   dateDebut?: string,
  //   dateFin?: string,
  //   typeMvt?: string,
  //   produitId?: string,
  // ): Promise<any[]> {
  //   console.log('findAll params:', {
  //     searchTerm,
  //     dateDebut,
  //     dateFin,
  //     typeMvt,
  //     produitId,
  //   });

  //   let query = this.mMvtStockRepository
  //     .createQueryBuilder('m_mvt_stock')
  //     .leftJoinAndSelect('m_mvt_stock.produit', 'produit')
  //     .leftJoinAndSelect('produit.marque', 'marque')
  //     .leftJoinAndSelect('produit.titulaire_amm', 'titulaire_amm')
  //     .leftJoinAndSelect('m_mvt_stock.typeMvt', 'typeMvt')
  //     .leftJoinAndSelect('m_mvt_stock.ligneCommandeVente', 'ligneCommandeVente')
  //     .leftJoinAndSelect('ligneCommandeVente.commandeVente', 'commandeVente')
  //     .leftJoin('commandeVente.client', 'client')
  //     .addSelect(['client.id_client', 'client.nom'])
  //     .orderBy('m_mvt_stock.id_mouvement', 'DESC');

  //   // Filtre par défaut pour l'année 2025
  //   query = query.andWhere('YEAR(m_mvt_stock.date) = :year', { year: 2025 });

  //   // Surcharge avec dateDebut et dateFin si fournis
  //   if (
  //     dateDebut &&
  //     dateFin &&
  //     dateDebut !== 'NaN' &&
  //     dateFin !== 'NaN' &&
  //     dateDebut.trim() !== '' &&
  //     dateFin.trim() !== ''
  //   ) {
  //     const dateFinEnd = new Date(
  //       new Date(dateFin).setDate(new Date(dateFin).getDate() + 1),
  //     )
  //       .toISOString()
  //       .split('T')[0];
  //     query = query.andWhere(
  //       'm_mvt_stock.date >= :dateDebut AND m_mvt_stock.date < :dateFinEnd',
  //       { dateDebut, dateFinEnd },
  //     );
  //   } else if (dateDebut && dateDebut !== 'NaN' && dateDebut.trim() !== '') {
  //     query = query.andWhere('m_mvt_stock.date >= :dateDebut', { dateDebut });
  //   } else if (dateFin && dateFin !== 'NaN' && dateFin.trim() !== '') {
  //     const dateFinEnd = new Date(
  //       new Date(dateFin).setDate(new Date(dateFin).getDate() + 1),
  //     )
  //       .toISOString()
  //       .split('T')[0];
  //     query = query.andWhere('m_mvt_stock.date < :dateFinEnd', { dateFinEnd });
  //   }

  //   if (searchTerm && searchTerm.trim() !== '') {
  //     const searchLower = `%${searchTerm.toLowerCase()}%`;
  //     query = query.andWhere('LOWER(produit.produit) LIKE :search', {
  //       search: searchLower,
  //     });
  //   }

  //   if (typeMvt && typeMvt.trim() !== '') {
  //     query = query.andWhere('typeMvt.type_mvt = :typeMvt', { typeMvt });
  //   }

  //   if (produitId && produitId !== '0' && produitId.trim() !== '') {
  //     query = query.andWhere('m_mvt_stock.id_produit = :produitId', {
  //       produitId: Number(produitId),
  //     });
  //   }

  //   const queryString = query.getSql();
  //   console.log('Generated SQL:', queryString);
  //   let result = await query.getMany();
  //   console.log('findAll result (2025):', result);

  //   // Vérifier et corriger les incohérences avec stock_courant
  //   for (const mvt of result) {
  //     const produit = mvt.produit;
  //     if (produit && mvt.stock_apres !== produit.stock_courant) {
  //       console.warn(
  //         `Incohérence détectée pour produit ${produit.produit} (id: ${produit.id_produit}): stock_apres = ${mvt.stock_apres}, stock_courant = ${produit.stock_courant}`,
  //       );
  //       // Optionnel : Mettre à jour stock_courant dans produit pour refléter le dernier mouvement
  //       // produit.stock_courant = mvt.stock_apres;
  //       // await this.produitRepository.save(produit);
  //     }
  //   }

  //   const formattedResult = result.map((mvt: any) => {
  //     const mnt =
  //       mvt.quantite && mvt.produit?.prix_unitaire
  //         ? mvt.quantite * mvt.produit.prix_unitaire
  //         : 0;
  //     const tva =
  //       mnt && mvt.produit?.taux_tva ? mnt * (mvt.produit.taux_tva / 100) : 0;
  //     const mntTTC = mnt + tva;
  //     const clientFournisseur =
  //       mvt.typeMvt?.type_mvt === 'Vente'
  //         ? (mvt.ligneCommandeVente?.commandeVente?.client?.nom ?? '-')
  //         : (mvt.produit?.titulaire_amm?.titulaire_amm ?? '-');

  //     const originalStockApres = mvt.stock_apres;
  //     const adjustedStockApres = Math.max(0, mvt.stock_apres);
  //     const hasStockOverdraw = mvt.stock_apres < 0;

  //     return {
  //       ...mvt,
  //       mnt,
  //       tva,
  //       mntTTC,
  //       clientFournisseur,
  //       stock_apres: adjustedStockApres,
  //       originalStockApres,
  //       hasStockOverdraw,
  //     };
  //   });

  //   return formattedResult;
  // }

  async findAllForExport(
    searchTerm?: string,
    dateDebut?: string,
    dateFin?: string,
    typeMvt?: string,
    produitId?: string,
  ): Promise<any[]> {
    const mouvements = await this.findAll(
      searchTerm,
      dateDebut,
      dateFin,
      typeMvt,
      produitId,
    );
    console.log('findAllForExport result:', mouvements);

    const formattedMouvements = mouvements.map((mvt: any) => {
      const mnt =
        mvt.quantite && mvt.produit?.prix_unitaire
          ? mvt.quantite * mvt.produit.prix_unitaire
          : 0;
      const tva =
        mnt && mvt.produit?.taux_tva ? mnt * (mvt.produit.taux_tva / 100) : 0;
      const mntTTC = mnt + tva;
      const clientFournisseur =
        mvt.typeMvt?.type_mvt === 'Vente'
          ? (mvt.ligneCommandeVente?.commandeVente?.client?.nom ?? '-')
          : (mvt.produit?.titulaire_amm?.titulaire_amm ?? '-');
      return {
        ...mvt,
        mnt,
        tva,
        mntTTC,
        clientFournisseur,
      };
    });

    return formattedMouvements;
  }

  async findOne(id: number): Promise<MMvtStock> {
    const entity = await this.mMvtStockRepository.findOne({
      where: { id_mouvement: id },
      relations: [
        'produit',
        'produit.marque',
        'produit.titulaire_amm',
        'typeMvt',
        'commandeVente',
        'commandeVente.client',
      ],
    });
    if (!entity) throw new NotFoundException('Mouvement not found');
    return entity;
  }

  async exportToExcel(
    searchTerm?: string,
    dateDebut?: string,
    dateFin?: string,
    typeMvt?: string,
    produitId?: string,
  ): Promise<Buffer> {
    console.log('exportToExcel params:', {
      searchTerm,
      dateDebut,
      dateFin,
      typeMvt,
      produitId,
    });
    const mouvements = await this.findAllForExport(
      searchTerm,
      dateDebut,
      dateFin,
      typeMvt,
      produitId,
    );
    console.log('Raw mouvements:', mouvements);

    const data = mouvements.map((mvt: any) => ({
      MvtID: mvt.id_mouvement,
      Date:
        mvt.date && typeof mvt.date === 'string' ? mvt.date.split('T')[0] : '-',
      Désignation: mvt.produit?.produit ?? '-',
      Qté: mvt.quantite ?? 0,
      Mnt: mvt.mnt ?? 0,
      TVA: mvt.tva ?? 0,
      'Mnt TTC': mvt.mntTTC ?? 0,
      'Type Mvt': mvt.typeMvt?.type_mvt ?? '-',
      'Stock avant': mvt.stock_avant ?? 0,
      'Stock après': mvt.stock_apres ?? 0,
      'Num. Facture': mvt.id_commande_vente ?? '-',
      'Client/Fournisseur': mvt.clientFournisseur ?? '-',
    }));

    console.log('exportToExcel data:', data);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mouvements Stock');
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    });

    return excelBuffer;
  }

  async findFournisseurs(): Promise<TitulaireAmm[]> {
    return this.titulaireAmmRepository.find();
  }

  async findProduits(): Promise<Produit[]> {
    return this.produitRepository.find();
  }
}
