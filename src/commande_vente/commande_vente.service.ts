import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { CommandeVente } from './commande_vente.entity';
import { CreateCommandeVenteDto } from './dto/create-commande_vente.dto';
import { UpdateCommandeVenteDto } from './dto/update-commande_vente.dto';
import { LignesCommandeVente } from '../lignes_commande_vente/lignes_commande_vente.entity';
import { Produit } from '../produit/produit.entity';
import { Client } from '../client/client.entity';
import { SaleDto } from './dto/sales.dto';
import * as ExcelJS from 'exceljs';
import { Buffer } from 'node:buffer';

import { Response } from 'express';
import { LignesCommandeVenteService } from '../lignes_commande_vente/lignes_commande_vente.service';
import { Remise } from '../remise/remise.entity';
import { Isb } from '../isb/isb.entity';
import { TypeReglement } from '../type_reglement/type_reglement.entity';
import { numberToWordsFr } from './number-to-words';
import * as PDFDocument from 'pdfkit';
import { CreateLignesCommandeVenteDto } from '../lignes_commande_vente/dto/create-lignes_commande_vente.dto';
import { MMvtStock } from 'src/m_mvt_stock/m_mvt_stock.entity';
import { CaptureStockService } from 'src/capture_stock/capture_stock.service';
import { Log } from 'src/log/log.entity';
import { GetUnpaidInvoicesDto } from './dto/invoice-unpaid.dto';
import * as fs from 'fs';

interface InvoiceLine {
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
}

interface InvoiceCommande {
  numero_commande: number;
  lignes: InvoiceLine[];
  total: number;
  montant_regle: number;
  montant_restant: number;
}

export interface ClientInvoice {
  client: string;
  commandes: InvoiceCommande[];
}

interface ProductSalesHistory {
  id_facture: number;
  date_facture: Date;
  client_nom: string;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
  commentaire: string | null;
}

function sanitizeString(str: string | null | undefined): string {
  if (!str) return 'N/A';
  return str.replace(/[^\w\s-]/g, '').trim();
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) {
    console.log('Date vide:', date);
    return 'N/A';
  }

  // Si c'est déjà un objet Date, formater directement
  if (date instanceof Date) {
    return date.toLocaleDateString('fr-FR'); // JJ/MM/AAAA
  }

  // Convertir en chaîne si ce n'est pas déjà une chaîne
  const dateStr = String(date).trim();
  console.log('Date brute:', dateStr); // Log pour déboguer

  // Essayer avec new Date
  try {
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('fr-FR'); // JJ/MM/AAAA
    }
  } catch {
    console.log('Échec new Date pour:', dateStr);
  }

  // Essayer de parser manuellement les formats courants
  // Format YYYY-MM-DD
  const ymdMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    try {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1; // Mois de 0 à 11
      const day = parseInt(ymdMatch[3], 10);
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('fr-FR'); // JJ/MM/AAAA
      }
    } catch {
      console.log('Échec parsing YYYY-MM-DD pour:', dateStr);
    }
  }

  // Format DD/MM/YYYY
  const dmyMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmyMatch) {
    try {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('fr-FR'); // JJ/MM/AAAA
      }
    } catch {
      console.log('Échec parsing DD/MM/YYYY pour:', dateStr);
    }
  }

  // Format YYYY/MM/DD
  const ymdSlashMatch = dateStr.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (ymdSlashMatch) {
    try {
      const year = parseInt(ymdSlashMatch[1], 10);
      const month = parseInt(ymdSlashMatch[2], 10) - 1;
      const day = parseInt(ymdSlashMatch[3], 10);
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('fr-FR'); // JJ/MM/AAAA
      }
    } catch {
      console.log('Échec parsing YYYY/MM/DD pour:', dateStr);
    }
  }

  // Si aucun format ne fonctionne
  console.log('Format de date non reconnu:', dateStr);
  return 'N/A';
}
@Injectable()
export class CommandeVenteService {
  private readonly VALID_TYPES = ['full', 'simple', 'bl', 'bp'] as const;
  private readonly MARGINS = 40;
  private readonly PAGE_WIDTH = 595.28; // A4 width
  private readonly HEADER_HEIGHT = 80;
  private readonly ROW_HEIGHT = 20;
  private readonly MAX_Y = 750;
  constructor(
    @InjectRepository(CommandeVente)
    private commandeVenteRepository: Repository<CommandeVente>,

    @InjectRepository(Client)
    private clientRepository: Repository<Client>,

    private lignesCommandeVenteService: LignesCommandeVenteService,

    @InjectRepository(Remise)
    private remiseRepository: Repository<Remise>,
    @InjectRepository(Isb)
    private isbRepository: Repository<Isb>,

    @InjectRepository(TypeReglement)
    private typeReglementRepository: Repository<TypeReglement>,
    @InjectRepository(MMvtStock)
    private mvtStockRepository: Repository<MMvtStock>,

    private captureStockService: CaptureStockService,

    @InjectRepository(Log)
    private logRepository: Repository<Log>,

    @InjectRepository(LignesCommandeVente)
    private lignesCommandeVenteRepository: Repository<LignesCommandeVente>,
  ) {}

  getA() {
    return this.commandeVenteRepository.find();
  }
  async getProductSalesHistory(
    id_produit: number,
    date_debut?: string,
    date_fin?: string,
    id_client?: number,
  ): Promise<ProductSalesHistory[]> {
    if (!id_produit) {
      throw new BadRequestException('ID du produit est requis');
    }

    const queryBuilder = this.lignesCommandeVenteRepository
      .createQueryBuilder('lcv')
      .innerJoin(
        'commande_vente',
        'cv',
        'lcv.id_commande_vente = cv.id_commande_vente',
      )
      .leftJoin('client', 'c', 'cv.id_client = c.id_client')
      .select([
        'cv.id_commande_vente AS id_facture',
        'cv.date_commande_vente AS date_facture',
        'c.nom AS client_nom',
        'lcv.quantite AS quantite',
        'lcv.prix_vente AS prix_unitaire',
        'lcv.montant AS montant_ligne',
        'lcv.description_remise AS commentaire',
      ])
      .where('lcv.designation = :id_produit', { id_produit });

    if (date_debut && date_fin) {
      const startDate = new Date(date_debut);
      const endDate = new Date(date_fin);
      endDate.setHours(23, 59, 59, 999); // Inclure toute la journée
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Dates invalides');
      }
      queryBuilder.andWhere(
        'cv.date_commande_vente BETWEEN :date_debut AND :date_fin',
        {
          date_debut: startDate,
          date_fin: endDate,
        },
      );
    }

    if (id_client) {
      queryBuilder.andWhere('cv.id_client = :id_client', { id_client });
    }

    queryBuilder.orderBy('cv.date_commande_vente', 'DESC'); // Plus récent en haut

    try {
      const salesHistory = await queryBuilder.getRawMany();
      // console.log(
      //   'Historique des ventes:',
      //   JSON.stringify(salesHistory, null, 2),
      // );
      return salesHistory;
    } catch (error) {
      console.error(
        'Erreur lors de la récupération de l’historique:',
        JSON.stringify(error, null, 2),
      );
      throw new BadRequestException(
        'Erreur lors de la récupération de l’historique des ventes',
      );
    }
  }

  async generatePdf(
    id: number,
    res: Response,
    type: 'full' | 'simple' | 'bl' | 'bp' = 'full',
  ): Promise<void> {
    if (!this.VALID_TYPES.includes(type)) {
      throw new BadRequestException(`Type de document non valide: ${type}`);
    }

    try {
      // Récupérer la commande
      const commande = await this.commandeVenteRepository.findOne({
        where: { id_commande_vente: id },
        relations: ['client', 'lignes', 'lignes.produit'],
      });

      if (!commande) {
        throw new NotFoundException(`Commande avec id ${id} non trouvée`);
      }

      if (!commande.lignes || !commande.client) {
        throw new BadRequestException('Données de commande incomplètes');
      }

      // Créer le document PDF
      const doc = new PDFDocument({ size: 'A4', margin: this.MARGINS });
      res.setHeader('Content-Type', 'application/pdf');
      const documentType =
        type === 'bl'
          ? 'bon_de_livraison'
          : type === 'bp'
            ? 'bon_de_preparation'
            : 'facture';
      const filename = `${documentType}_${sanitizeString(commande.id_commande_vente.toString())}_${type}.pdf`;
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      // Sauvegarde locale pour débogage
      doc.pipe(fs.createWriteStream(`test_${documentType}_${id}.pdf`));
      doc.pipe(res);

      // En-tête commun
      this.drawHeader(doc, commande, type);

      // Corps du document
      switch (type) {
        case 'full':
          this.drawFullInvoice(doc, commande);
          break;
        case 'simple':
          this.drawSimpleInvoice(doc, commande);
          break;
        case 'bl':
          this.drawDeliveryNote(doc, commande);
          break;
        case 'bp':
          this.drawPreparationNote(doc, commande);
          break;
      }

      // Finaliser le document
      doc.end();

      // Mettre à jour la commande
      commande.imprimee = 1;
      await this.commandeVenteRepository.save(commande);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          message: `Erreur lors de la génération du PDF: ${error.message}`,
        });
      }
      throw new BadRequestException(
        `Erreur lors de la génération du PDF: ${error.message}`,
      );
    }
  }

  // private drawHeader(doc: PDFDocument, commande: any, type: string): void {
  //   const headerTop = 40;
  //   const sectionWidth = (this.PAGE_WIDTH - 2 * this.MARGINS) / 3;

  //   // Section 1: Alliance Pharma
  //   doc
  //     .rect(this.MARGINS, headerTop, sectionWidth, this.HEADER_HEIGHT)
  //     .strokeColor('black')
  //     .stroke();
  //   doc.fontSize(10).font('Helvetica-Bold');
  //   doc.text('ALLIANCE PHARMA', this.MARGINS + 10, headerTop + 10, {
  //     width: sectionWidth - 20,
  //     align: 'center',
  //   });
  //   doc.fontSize(8).font('Helvetica');
  //   doc.text('Tel: 80130610', this.MARGINS + 10, headerTop + 25, {
  //     width: sectionWidth - 20,
  //     align: 'center',
  //   });
  //   // ... autres textes similaires

  //   // Section 2: Logo
  //   doc
  //     .rect(
  //       this.MARGINS + sectionWidth,
  //       headerTop,
  //       sectionWidth,
  //       this.HEADER_HEIGHT,
  //     )
  //     .strokeColor('black')
  //     .stroke();
  //   try {
  //     doc.image(
  //       'src/uploads/rmlogo.png',
  //       this.MARGINS + sectionWidth + (sectionWidth - 90) / 2,
  //       headerTop + 10,
  //       {
  //         width: 90,
  //       },
  //     );
  //   } catch (error) {
  //     doc
  //       .fontSize(10)
  //       .font('Helvetica-Bold')
  //       .text('LOGO', this.MARGINS + sectionWidth + 10, headerTop + 40, {
  //         width: sectionWidth - 20,
  //         align: 'center',
  //       });
  //   }

  //   // Section 3: Numéro et date
  //   doc
  //     .rect(
  //       this.MARGINS + 2 * sectionWidth,
  //       headerTop,
  //       sectionWidth,
  //       this.HEADER_HEIGHT,
  //     )
  //     .strokeColor('black')
  //     .stroke();
  //   doc.fontSize(6).font('Helvetica-Bold');
  //   const documentTitle =
  //     type === 'bl'
  //       ? 'BON DE LIVRAISON'
  //       : type === 'bp'
  //         ? 'BON DE PRÉPARATION'
  //         : 'FACTURE DE VENTE';
  //   doc.text(
  //     `${documentTitle} N° ${sanitizeString(commande.numero_facture_certifiee || commande.id_commande_vente.toString())}`,
  //     this.MARGINS + 2 * sectionWidth + 10,
  //     headerTop + 10,
  //     { width: sectionWidth - 20, align: 'center' },
  //   );
  //   doc.fontSize(8).font('Helvetica');
  //   doc.text(
  //     `Date: ${formatDate(commande.date_commande_vente)}`,
  //     this.MARGINS + 2 * sectionWidth + 10,
  //     headerTop + 30,
  //     {
  //       width: sectionWidth - 20,
  //       align: 'center',
  //     },
  //   );

  //   // Séparateurs
  //   doc
  //     .moveTo(this.MARGINS + sectionWidth, headerTop)
  //     .lineTo(this.MARGINS + sectionWidth, headerTop + this.HEADER_HEIGHT)
  //     .stroke();
  //   doc
  //     .moveTo(this.MARGINS + 2 * sectionWidth, headerTop)
  //     .lineTo(this.MARGINS + 2 * sectionWidth, headerTop + this.HEADER_HEIGHT)
  //     .stroke();
  //   doc
  //     .moveTo(this.MARGINS, headerTop + this.HEADER_HEIGHT + 10)
  //     .lineTo(
  //       this.PAGE_WIDTH - this.MARGINS,
  //       headerTop + this.HEADER_HEIGHT + 10,
  //     )
  //     .stroke();

  //   // Infos utilisateur et client
  //   const infoTop = headerTop + this.HEADER_HEIGHT + 20;
  //   doc.fontSize(8).font('Helvetica');
  //   doc.text(`Login: ${sanitizeString(commande.login)}`, this.MARGINS, infoTop);
  //   const clientX = this.MARGINS + 400;
  //   doc.text(
  //     `Client: ${sanitizeString(commande.client?.nom || 'N/A')}`,
  //     clientX,
  //     infoTop,
  //   );
  //   doc.text(
  //     `NIF: ${sanitizeString(commande.client?.nif || 'N/A')}`,
  //     clientX,
  //     infoTop + 15,
  //   );
  //   doc.text(
  //     `Adresse: ${sanitizeString(commande.client?.adresse || 'N/A')}`,
  //     clientX,
  //     infoTop + 30,
  //   );
  //   doc.text(
  //     `Téléphone: ${sanitizeString(commande.client?.telephone || 'N/A')}`,
  //     clientX,
  //     infoTop + 45,
  //   );
  // }

  private drawHeader(doc: PDFDocument, commande: any, type: string): number {
    const headerTop = 40;
    const sectionWidth = (this.PAGE_WIDTH - 2 * this.MARGINS) / 3;

    // Section 1: Alliance Pharma
    doc
      .rect(this.MARGINS, headerTop, sectionWidth, this.HEADER_HEIGHT)
      .strokeColor('black')
      .stroke();
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ALLIANCE PHARMA', this.MARGINS + 10, headerTop + 10, {
      width: sectionWidth - 20,
      align: 'center',
    });
    doc.fontSize(8).font('Helvetica');
    doc.text('Tel: 80130610', this.MARGINS + 10, headerTop + 25, {
      width: sectionWidth - 20,
      align: 'center',
    });
    doc.text(
      'RCCM: NE/NIM/01/2024/B14/00004',
      this.MARGINS + 10,
      headerTop + 35,
      {
        width: sectionWidth - 20,
        align: 'center',
      },
    );
    doc.text('NIF: 37364/R', this.MARGINS + 10, headerTop + 45, {
      width: sectionWidth - 20,
      align: 'center',
    });
    doc.text('BP: 11807', this.MARGINS + 10, headerTop + 55, {
      width: sectionWidth - 20,
      align: 'center',
    });
    doc.text('Adresse: NIAMEY', this.MARGINS + 10, headerTop + 65, {
      width: sectionWidth - 20,
      align: 'center',
    });

    // Section 2: Logo
    doc
      .rect(
        this.MARGINS + sectionWidth,
        headerTop,
        sectionWidth,
        this.HEADER_HEIGHT,
      )
      .strokeColor('black')
      .stroke();
    try {
      doc.image(
        'src/uploads/rmlogo.png',
        this.MARGINS + sectionWidth + (sectionWidth - 90) / 2,
        headerTop + 10,
        {
          width: 90,
        },
      );
    } catch (error) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('LOGO', this.MARGINS + sectionWidth + 10, headerTop + 40, {
          width: sectionWidth - 20,
          align: 'center',
        });
    }

    // Section 3: Numéro et date
    doc
      .rect(
        this.MARGINS + 2 * sectionWidth,
        headerTop,
        sectionWidth,
        this.HEADER_HEIGHT,
      )
      .strokeColor('black')
      .stroke();
    doc.fontSize(8).font('Helvetica-Bold');
    const documentTitle =
      type === 'bl'
        ? 'BON DE LIVRAISON'
        : type === 'bp'
          ? 'BON DE PRÉPARATION'
          : 'FACTURE DE VENTE';
    doc.text(
      `${documentTitle} N° ${sanitizeString(commande.id_commande_vente.toString())}`,
      this.MARGINS + 2 * sectionWidth + 10,
      headerTop + 10,
      { width: sectionWidth - 20, align: 'center' },
    );
    doc.fontSize(8).font('Helvetica');
    doc.text(
      `Date: ${formatDate(commande.date_commande_vente)}`,
      this.MARGINS + 2 * sectionWidth + 10,
      headerTop + 30,
      {
        width: sectionWidth - 20,
        align: 'center',
      },
    );

    // Séparateurs verticaux
    doc
      .moveTo(this.MARGINS + sectionWidth, headerTop)
      .lineTo(this.MARGINS + sectionWidth, headerTop + this.HEADER_HEIGHT)
      .stroke();
    doc
      .moveTo(this.MARGINS + 2 * sectionWidth, headerTop)
      .lineTo(this.MARGINS + 2 * sectionWidth, headerTop + this.HEADER_HEIGHT)
      .stroke();

    // Ligne de séparation sous l'en-tête
    const separatorY = headerTop + this.HEADER_HEIGHT + 10;
    doc
      .moveTo(this.MARGINS, separatorY)
      .lineTo(this.PAGE_WIDTH - this.MARGINS, separatorY)
      .stroke();

    // Informations utilisateur et client - AVEC ESPACEMENT APPROPRIÉ
    const infoTop = separatorY + 15; // 15px après la ligne de séparation
    doc.fontSize(8).font('Helvetica');

    // Colonne de gauche - Informations utilisateur
    doc.text(`Login: ${sanitizeString(commande.login)}`, this.MARGINS, infoTop);

    // Colonne de droite - Informations client
    const clientX = this.MARGINS + 300; // Position fixe pour éviter les chevauchements
    doc.text(
      `Client: ${sanitizeString(commande.client?.nom || 'N/A')}`,
      clientX,
      infoTop,
    );
    doc.text(
      `NIF: ${sanitizeString(commande.client?.nif || 'N/A')}`,
      clientX,
      infoTop + 12,
    );
    doc.text(
      `Adresse: ${sanitizeString(commande.client?.adresse || 'N/A')}`,
      clientX,
      infoTop + 24,
    );
    doc.text(
      `Téléphone: ${sanitizeString(commande.client?.telephone || 'N/A')}`,
      clientX,
      infoTop + 36,
    );

    // Retourner la position Y où le tableau peut commencer
    return infoTop + 55; // 55px après le début des infos pour laisser de l'espace
  }

  // private drawFullInvoice(doc: PDFDocument, commande: any): void {
  //   const tableTop = 160;
  //   const tableLeft = this.MARGINS;
  //   const columnWidths = [200, 80, 80, 80, 100, 80];

  //   // En-tête du tableau
  //   this.drawTableHeader(doc, tableTop, tableLeft, columnWidths, [
  //     'Désignation',
  //     'Quantité',
  //     'Prix Unitaire',
  //     'Remise',
  //     "Date d'expiration",
  //     'Montant',
  //   ]);

  //   // Lignes
  //   let y = tableTop + 30;
  //   let subtotal = 0;
  //   commande.lignes.forEach((ligne: any) => {
  //     if (y + this.ROW_HEIGHT > this.MAX_Y) {
  //       doc.addPage();
  //       y = 40;
  //       this.drawTableHeader(doc, y, tableLeft, columnWidths, [
  //         'Désignation',
  //         'Quantité',
  //         'Prix Unitaire',
  //         'Remise',
  //         "Date d'expiration",
  //         'Montant',
  //       ]);
  //       y += 30;
  //     }

  //     const totalLigne =
  //       ligne.montant ||
  //       ligne.prix_vente * ligne.quantite * (1 - (ligne.remise || 0) / 100);
  //     subtotal += totalLigne;
  //     let x = tableLeft;
  //     doc.text(
  //       sanitizeString(
  //         ligne.produit?.produit || ligne.designation?.toString() || 'N/A',
  //       ),
  //       x,
  //       y,
  //       { width: columnWidths[0], align: 'left' },
  //     );
  //     x += columnWidths[0];
  //     doc.text(ligne.quantite.toString(), x, y, {
  //       width: columnWidths[1],
  //       align: 'center',
  //     });
  //     x += columnWidths[1];
  //     doc.text(Number(ligne.prix_vente || 0).toFixed(2), x, y, {
  //       width: columnWidths[2],
  //       align: 'center',
  //     });
  //     x += columnWidths[2];
  //     doc.text(Number(ligne.remise || 0).toFixed(2), x, y, {
  //       width: columnWidths[3],
  //       align: 'center',
  //     });
  //     x += columnWidths[3];
  //     doc.text(formatDate(ligne.produit?.validite_amm), x, y, {
  //       width: columnWidths[4],
  //       align: 'center',
  //     });
  //     x += columnWidths[4];
  //     doc.text(Number(totalLigne).toFixed(2), x, y, {
  //       width: columnWidths[5],
  //       align: 'center',
  //     });
  //     y += this.ROW_HEIGHT;
  //   });

  //   doc
  //     .moveTo(tableLeft, y)
  //     .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y)
  //     .stroke();

  //   // Résumé
  //   const summaryTop = y + 20 > this.MAX_Y ? (doc.addPage(), 40) : y + 20;
  //   const financials = this.calculateFinancials(commande);
  //   this.drawSummary(doc, summaryTop, financials, commande);
  // }

  private drawFullInvoice(doc: PDFDocument, commande: any): void {
    // Récupérer la position Y après l'en-tête
    const tableTop = this.drawHeader(doc, commande, 'full');
    const tableLeft = this.MARGINS;
    const columnWidths = [200, 60, 70, 60, 80, 70]; // Ajusté pour éviter débordement

    // En-tête du tableau
    this.drawTableHeader(doc, tableTop, tableLeft, columnWidths, [
      'Désignation',
      'Qté',
      'P.U.',
      'Remise',
      'Expiration',
      'Montant',
    ]);

    // Lignes du tableau
    let y = tableTop + 25; // Espace après l'en-tête du tableau
    let subtotal = 0;

    doc.fontSize(8).font('Helvetica'); // Taille plus petite pour éviter débordement

    commande.lignes.forEach((ligne: any) => {
      if (y + this.ROW_HEIGHT > this.MAX_Y - 100) {
        // Garder 100px pour le résumé
        doc.addPage();
        const newTableTop = this.drawHeader(doc, commande, 'full');
        this.drawTableHeader(doc, newTableTop, tableLeft, columnWidths, [
          'Désignation',
          'Qté',
          'P.U.',
          'Remise',
          'Expiration',
          'Montant',
        ]);
        y = newTableTop + 25;
      }

      const totalLigne = ligne.prix_vente * ligne.quantite;
      subtotal += totalLigne;

      let x = tableLeft;
      // Désignation (tronquée si trop longue)
      const designation = sanitizeString(
        ligne.produit?.produit || ligne.designation?.toString() || 'N/A',
      );
      doc.text(designation.substring(0, 35), x, y, {
        width: columnWidths[0],
        align: 'left',
      });
      x += columnWidths[0];

      // Quantité
      doc.text(ligne.quantite.toString(), x, y, {
        width: columnWidths[1],
        align: 'center',
      });
      x += columnWidths[1];

      // Prix unitaire
      doc.text(Number(ligne.prix_vente || 0).toFixed(2), x, y, {
        width: columnWidths[2],
        align: 'right',
      });
      x += columnWidths[2];

      // Remise
      doc.text(Number(ligne.remise || 0).toFixed(2), x, y, {
        width: columnWidths[3],
        align: 'right',
      });
      x += columnWidths[3];

      // Date d'expiration (format court)
      const dateExp = ligne.produit?.validite_amm
        ? new Date(ligne.produit.validite_amm).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })
        : 'N/A';
      doc.text(dateExp, x, y, {
        width: columnWidths[4],
        align: 'center',
      });
      x += columnWidths[4];

      // Montant total ligne
      doc.text(Number(totalLigne).toFixed(2), x, y, {
        width: columnWidths[5],
        align: 'right',
      });

      y += this.ROW_HEIGHT;
    });

    // Ligne de fermeture du tableau
    doc
      .moveTo(tableLeft, y)
      .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y)
      .stroke();

    // Résumé financier - avec espace approprié
    const summaryTop = y + 20;
    if (summaryTop > this.MAX_Y - 150) {
      doc.addPage();
      this.drawFinancialSummary(doc, 40, commande);
    } else {
      this.drawFinancialSummary(doc, summaryTop, commande);
    }
  }

  private drawFinancialSummary(
    doc: PDFDocument,
    summaryTop: number,
    commande: any,
  ): void {
    // Calculs basés sur les données de la commande (corrigés selon ta logique)
    const montantHT = commande.lignes.reduce(
      (sum: number, ligne: any) => sum + ligne.prix_vente * ligne.quantite,
      0,
    );
    const remise = Number(commande.remise || 0);
    const montantNetHT = montantHT - remise;
    const tva = Number(commande.tva || 0);
    const isb = Number(commande.isb || 0);
    const timbreFiscal = 200;
    const totalTTC = montantNetHT + tva + isb + timbreFiscal;

    // Titre
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('RÉSUMÉ FINANCIER', this.MARGINS, summaryTop);

    // Ligne de séparation
    doc
      .moveTo(this.MARGINS, summaryTop + 15)
      .lineTo(this.PAGE_WIDTH - this.MARGINS, summaryTop + 15)
      .stroke();

    let currentY = summaryTop + 25;
    doc.fontSize(9).font('Helvetica');

    // Montant HT initial
    doc.text('Montant HT:', this.MARGINS, currentY);
    doc.text(
      `${montantHT.toFixed(2)} CFA`,
      this.PAGE_WIDTH - this.MARGINS - 100,
      currentY,
      { align: 'right' },
    );
    currentY += 15;

    // Remise (si > 0)
    if (remise > 0) {
      doc.text('Remise:', this.MARGINS, currentY);
      doc.text(
        `-${remise.toFixed(2)} CFA`,
        this.PAGE_WIDTH - this.MARGINS - 100,
        currentY,
        { align: 'right' },
      );
      currentY += 15;

      // Net HT après remise
      doc.text('Net HT:', this.MARGINS, currentY);
      doc.text(
        `${montantNetHT.toFixed(2)} CFA`,
        this.PAGE_WIDTH - this.MARGINS - 100,
        currentY,
        { align: 'right' },
      );
      currentY += 15;
    }

    // TVA (si > 0)
    if (tva > 0) {
      const tauxTVA =
        montantNetHT > 0 ? ((tva / montantNetHT) * 100).toFixed(0) : '0';
      doc.text(`TVA (${tauxTVA}%):`, this.MARGINS, currentY);
      doc.text(
        `${tva.toFixed(2)} CFA`,
        this.PAGE_WIDTH - this.MARGINS - 100,
        currentY,
        { align: 'right' },
      );
      currentY += 15;
    }

    // ISB/Précompte
    if (isb > 0) {
      doc.text('ISB/Précompte (2%):', this.MARGINS, currentY);
      doc.text(
        `${isb.toFixed(2)} CFA`,
        this.PAGE_WIDTH - this.MARGINS - 100,
        currentY,
        { align: 'right' },
      );
      currentY += 15;
    }

    // Timbre fiscal
    doc.text('Timbre Fiscal:', this.MARGINS, currentY);
    doc.text(
      `${timbreFiscal.toFixed(2)} CFA`,
      this.PAGE_WIDTH - this.MARGINS - 100,
      currentY,
      { align: 'right' },
    );
    currentY += 20;

    // Ligne de séparation avant total
    doc
      .moveTo(this.MARGINS, currentY)
      .lineTo(this.PAGE_WIDTH - this.MARGINS, currentY)
      .stroke();
    currentY += 10;

    // Total TTC (en gras)
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('TOTAL TTC:', this.MARGINS, currentY);
    doc.text(
      `${totalTTC.toFixed(2)} CFA`,
      this.PAGE_WIDTH - this.MARGINS - 100,
      currentY,
      { align: 'right' },
    );
    currentY += 25;

    // Informations complémentaires
    doc.fontSize(8).font('Helvetica');
    doc.text(
      `Moyen de paiement: ${sanitizeString(commande.type_reglement || 'E')}`,
      this.MARGINS,
      currentY,
    );
    currentY += 12;
    doc.text(
      `Nombre d'articles: ${commande.lignes.length}`,
      this.MARGINS,
      currentY,
    );
    currentY += 12;
    doc.text('* Montants en francs CFA', this.MARGINS, currentY);
    currentY += 20;

    // Conversion en lettres
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text(
      'Arrêté la présente facture à la somme de :',
      this.MARGINS,
      currentY,
    );
    currentY += 15;
    doc.fontSize(9).font('Helvetica');
    doc.text(
      `${numberToWordsFr(totalTTC)} francs CFA`,
      this.MARGINS,
      currentY,
      {
        width: this.PAGE_WIDTH - 2 * this.MARGINS,
        align: 'center',
      },
    );
    currentY += 25;

    // Signature
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Le Gestionnaire', this.MARGINS, currentY, { underline: true });

    // Ligne finale
    doc
      .moveTo(this.MARGINS, currentY + 20)
      .lineTo(this.PAGE_WIDTH - this.MARGINS, currentY + 20)
      .stroke();
  }
  private drawSimpleInvoice(doc: PDFDocument, commande: any): void {
    const tableTop = 110;
    const tableLeft = 50;
    const columnWidths = [250, 50, 70, 80];

    // En-tête du tableau
    this.drawTableHeader(doc, tableTop, tableLeft, columnWidths, [
      'Désignation',
      'Qté',
      'P.U.',
      'Total',
    ]);

    // Lignes
    let y = tableTop + 30;
    let subtotal = 0;
    commande.lignes.forEach((ligne: any) => {
      if (y + this.ROW_HEIGHT > this.MAX_Y) {
        doc.addPage();
        y = 40;
        this.drawTableHeader(doc, y, tableLeft, columnWidths, [
          'Désignation',
          'Qté',
          'P.U.',
          'Total',
        ]);
        y += 30;
      }

      const totalLigne = ligne.montant || ligne.prix_vente * ligne.quantite;
      subtotal += totalLigne;
      let x = tableLeft;
      doc.text(
        sanitizeString(
          ligne.produit?.produit || ligne.designation?.toString() || 'N/A',
        ),
        x,
        y,
        { width: columnWidths[0], align: 'left' },
      );
      x += columnWidths[0];
      doc.text(ligne.quantite.toString(), x, y, {
        width: columnWidths[1],
        align: 'center',
      });
      x += columnWidths[1];
      doc.text(Number(ligne.prix_vente || 0).toFixed(2), x, y, {
        width: columnWidths[2],
        align: 'right',
      });
      x += columnWidths[2];
      doc.text(Number(totalLigne).toFixed(2), x, y, {
        width: columnWidths[3],
        align: 'right',
      });
      y += this.ROW_HEIGHT;
    });

    doc
      .moveTo(tableLeft, y)
      .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y)
      .stroke();

    // Résumé
    const summaryTop = y + 20 > this.MAX_Y ? (doc.addPage(), 40) : y + 20;
    const financials = this.calculateFinancials(commande);
    this.drawSimpleSummary(doc, summaryTop, financials);
  }

  // private drawDeliveryNote(doc: PDFDocument, commande: any): void {
  //   const tableTop = 160;
  //   const tableLeft = this.MARGINS;
  //   const columnWidths = [300, 80, 120];

  //   // En-tête du tableau
  //   this.drawTableHeader(doc, tableTop, tableLeft, columnWidths, [
  //     'Désignation',
  //     'Quantité',
  //     "Date d'expiration",
  //   ]);

  //   // Lignes
  //   let y = tableTop + 30;
  //   commande.lignes.forEach((ligne: any) => {
  //     if (y + this.ROW_HEIGHT > this.MAX_Y) {
  //       doc.addPage();
  //       y = 40;
  //       this.drawTableHeader(doc, y, tableLeft, columnWidths, [
  //         'Désignation',
  //         'Quantité',
  //         "Date d'expiration",
  //       ]);
  //       y += 30;
  //     }

  //     let x = tableLeft;
  //     doc.text(
  //       sanitizeString(
  //         ligne.produit?.produit || ligne.designation?.toString() || 'N/A',
  //       ),
  //       x,
  //       y,
  //       { width: columnWidths[0], align: 'left' },
  //     );
  //     x += columnWidths[0];
  //     doc.text(ligne.quantite.toString(), x, y, {
  //       width: columnWidths[1],
  //       align: 'center',
  //     });
  //     x += columnWidths[1];
  //     doc.text(formatDate(ligne.produit?.validite_amm), x, y, {
  //       width: columnWidths[2],
  //       align: 'center',
  //     });
  //     y += this.ROW_HEIGHT;
  //   });

  //   doc
  //     .moveTo(tableLeft, y)
  //     .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y)
  //     .stroke();

  //   // Résumé
  //   const summaryTop = y + 20 > this.MAX_Y ? (doc.addPage(), 40) : y + 20;
  //   doc.fontSize(10).font('Helvetica-Bold');
  //   doc.text('Résumé', this.MARGINS, summaryTop);
  //   doc.fontSize(8).font('Helvetica');
  //   doc.text(
  //     `Nombre d'articles: ${commande.lignes.length}`,
  //     this.MARGINS,
  //     summaryTop + 15,
  //   );
  //   doc.text('Le Gestionnaire', this.MARGINS, summaryTop + 30, {
  //     underline: true,
  //   });
  //   doc
  //     .moveTo(this.MARGINS, summaryTop + 50)
  //     .lineTo(this.PAGE_WIDTH - this.MARGINS, summaryTop + 50)
  //     .stroke();
  // }

  private drawDeliveryNote(doc: PDFDocument, commande: any): void {
    // Utiliser la position dynamique après l'en-tête
    const tableTop = this.drawHeader(doc, commande, 'bl');
    const tableLeft = this.MARGINS;
    const columnWidths = [280, 80, 120]; // Ajusté pour meilleur équilibre

    // En-tête du tableau
    this.drawTableHeader(doc, tableTop, tableLeft, columnWidths, [
      'Désignation',
      'Quantité',
      "Date d'expiration",
    ]);

    // Lignes du tableau
    let y = tableTop + 25; // Espace après l'en-tête du tableau
    doc.fontSize(8).font('Helvetica'); // Taille appropriée

    commande.lignes.forEach((ligne: any) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (y + this.ROW_HEIGHT > this.MAX_Y - 80) {
        // Garder 80px pour le résumé
        doc.addPage();
        const newTableTop = this.drawHeader(doc, commande, 'bl');
        this.drawTableHeader(doc, newTableTop, tableLeft, columnWidths, [
          'Désignation',
          'Quantité',
          "Date d'expiration",
        ]);
        y = newTableTop + 25;
      }

      let x = tableLeft;

      // Désignation (tronquée si nécessaire)
      const designation = sanitizeString(
        ligne.produit?.produit || ligne.designation?.toString() || 'N/A',
      );
      doc.text(designation.substring(0, 45), x, y, {
        width: columnWidths[0],
        align: 'left',
      });
      x += columnWidths[0];

      // Quantité
      doc.text(ligne.quantite.toString(), x, y, {
        width: columnWidths[1],
        align: 'center',
      });
      x += columnWidths[1];

      // Date d'expiration (format court)
      const dateExp = ligne.produit?.validite_amm
        ? new Date(ligne.produit.validite_amm).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })
        : 'N/A';
      doc.text(dateExp, x, y, {
        width: columnWidths[2],
        align: 'center',
      });

      y += this.ROW_HEIGHT;
    });

    // Ligne de fermeture du tableau
    doc
      .moveTo(tableLeft, y)
      .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y)
      .stroke();

    // Résumé avec position appropriée
    const summaryTop = y + 20;
    if (summaryTop > this.MAX_Y - 60) {
      doc.addPage();
      this.drawDeliveryNoteSummary(doc, 40, commande);
    } else {
      this.drawDeliveryNoteSummary(doc, summaryTop, commande);
    }
  }

  private drawPreparationNote(doc: PDFDocument, commande: any): void {
    // Utiliser la position dynamique après l'en-tête
    const tableTop = this.drawHeader(doc, commande, 'bp');
    const tableLeft = this.MARGINS;
    const columnWidths = [220, 60, 100, 120]; // Ajusté pour 4 colonnes

    // En-tête du tableau
    this.drawTableHeader(doc, tableTop, tableLeft, columnWidths, [
      'Désignation',
      'Qté',
      'Expiration',
      'Emplacement',
    ]);

    // Lignes du tableau
    let y = tableTop + 25;
    doc.fontSize(8).font('Helvetica');

    commande.lignes.forEach((ligne: any) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (y + this.ROW_HEIGHT > this.MAX_Y - 80) {
        doc.addPage();
        const newTableTop = this.drawHeader(doc, commande, 'bp');
        this.drawTableHeader(doc, newTableTop, tableLeft, columnWidths, [
          'Désignation',
          'Qté',
          'Expiration',
          'Emplacement',
        ]);
        y = newTableTop + 25;
      }

      let x = tableLeft;

      // Désignation (tronquée)
      const designation = sanitizeString(
        ligne.produit?.produit || ligne.designation?.toString() || 'N/A',
      );
      doc.text(designation.substring(0, 35), x, y, {
        width: columnWidths[0],
        align: 'left',
      });
      x += columnWidths[0];

      // Quantité
      doc.text(ligne.quantite.toString(), x, y, {
        width: columnWidths[1],
        align: 'center',
      });
      x += columnWidths[1];

      // Date d'expiration (format court)
      const dateExp = ligne.produit?.validite_amm
        ? new Date(ligne.produit.validite_amm).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })
        : 'N/A';
      doc.text(dateExp, x, y, {
        width: columnWidths[2],
        align: 'center',
      });
      x += columnWidths[2];

      // Emplacement (tronqué si nécessaire)
      const emplacement = sanitizeString(ligne.produit?.emplacement || 'N/A');
      doc.text(emplacement.substring(0, 20), x, y, {
        width: columnWidths[3],
        align: 'center',
      });

      y += this.ROW_HEIGHT;
    });

    // Ligne de fermeture du tableau
    doc
      .moveTo(tableLeft, y)
      .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y)
      .stroke();

    // Résumé avec position appropriée
    const summaryTop = y + 20;
    if (summaryTop > this.MAX_Y - 60) {
      doc.addPage();
      this.drawPreparationNoteSummary(doc, 40, commande);
    } else {
      this.drawPreparationNoteSummary(doc, summaryTop, commande);
    }
  }

  // Méthodes helper pour les résumés
  private drawDeliveryNoteSummary(
    doc: PDFDocument,
    summaryTop: number,
    commande: any,
  ): void {
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('RÉSUMÉ DE LIVRAISON', this.MARGINS, summaryTop);

    // Ligne de séparation
    doc
      .moveTo(this.MARGINS, summaryTop + 15)
      .lineTo(this.PAGE_WIDTH - this.MARGINS, summaryTop + 15)
      .stroke();

    let currentY = summaryTop + 25;
    doc.fontSize(9).font('Helvetica');

    // Informations de livraison
    doc.text(
      `Nombre d'articles: ${commande.lignes.length}`,
      this.MARGINS,
      currentY,
    );
    currentY += 15;

    const quantiteTotale = commande.lignes.reduce(
      (sum: number, ligne: any) => sum + ligne.quantite,
      0,
    );
    doc.text(`Quantité totale: ${quantiteTotale}`, this.MARGINS, currentY);
    currentY += 15;

    doc.text(
      `Date de livraison: ${formatDate(new Date())}`,
      this.MARGINS,
      currentY,
    );
    currentY += 25;

    // Signatures
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Le Livreur', this.MARGINS, currentY);
    doc.text('Le Client', this.MARGINS + 300, currentY);
    currentY += 30;

    // Lignes pour signatures
    doc
      .moveTo(this.MARGINS, currentY)
      .lineTo(this.MARGINS + 150, currentY)
      .stroke();
    doc
      .moveTo(this.MARGINS + 300, currentY)
      .lineTo(this.MARGINS + 450, currentY)
      .stroke();
  }

  private drawPreparationNoteSummary(
    doc: PDFDocument,
    summaryTop: number,
    commande: any,
  ): void {
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('RÉSUMÉ DE PRÉPARATION', this.MARGINS, summaryTop);

    // Ligne de séparation
    doc
      .moveTo(this.MARGINS, summaryTop + 15)
      .lineTo(this.PAGE_WIDTH - this.MARGINS, summaryTop + 15)
      .stroke();

    let currentY = summaryTop + 25;
    doc.fontSize(9).font('Helvetica');

    // Informations de préparation
    doc.text(
      `Nombre d'articles: ${commande.lignes.length}`,
      this.MARGINS,
      currentY,
    );
    currentY += 15;

    const quantiteTotale = commande.lignes.reduce(
      (sum: number, ligne: any) => sum + ligne.quantite,
      0,
    );
    doc.text(`Quantité totale: ${quantiteTotale}`, this.MARGINS, currentY);
    currentY += 15;

    doc.text(
      `Date de préparation: ${formatDate(new Date())}`,
      this.MARGINS,
      currentY,
    );
    currentY += 15;

    doc.text('Status: À préparer', this.MARGINS, currentY);
    currentY += 25;

    // Cases à cocher
    doc.fontSize(8).font('Helvetica');
    doc.text('☐ Préparation terminée', this.MARGINS, currentY);
    currentY += 15;
    doc.text('☐ Contrôle qualité effectué', this.MARGINS, currentY);
    currentY += 15;
    doc.text('☐ Prêt pour livraison', this.MARGINS, currentY);
    currentY += 25;

    // Signature
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Le Préparateur', this.MARGINS, currentY);
    currentY += 20;

    // Ligne pour signature
    doc
      .moveTo(this.MARGINS, currentY)
      .lineTo(this.MARGINS + 200, currentY)
      .stroke();
  }
  // private drawPreparationNote(doc: PDFDocument, commande: any): void {
  //   const tableTop = 160;
  //   const tableLeft = this.MARGINS;
  //   const columnWidths = [250, 80, 120, 100];

  //   // En-tête du tableau
  //   this.drawTableHeader(doc, tableTop, tableLeft, columnWidths, [
  //     'Désignation',
  //     'Quantité',
  //     'Date d’expiration',
  //     'Emplacement',
  //   ]);

  //   // Lignes
  //   let y = tableTop + 30;
  //   commande.lignes.forEach((ligne: any) => {
  //     if (y + this.ROW_HEIGHT > this.MAX_Y) {
  //       doc.addPage();
  //       y = 40;
  //       this.drawTableHeader(doc, y, tableLeft, columnWidths, [
  //         'Désignation',
  //         'Quantité',
  //         'Date d’expiration',
  //         'Emplacement',
  //       ]);
  //       y += 30;
  //     }

  //     let x = tableLeft;
  //     doc.text(
  //       sanitizeString(
  //         ligne.produit?.produit || ligne.designation?.toString() || 'N/A',
  //       ),
  //       x,
  //       y,
  //       { width: columnWidths[0], align: 'left' },
  //     );
  //     x += columnWidths[0];
  //     doc.text(ligne.quantite.toString(), x, y, {
  //       width: columnWidths[1],
  //       align: 'center',
  //     });
  //     x += columnWidths[1];
  //     doc.text(formatDate(ligne.produit?.validite_amm), x, y, {
  //       width: columnWidths[2],
  //       align: 'center',
  //     });
  //     x += columnWidths[2];
  //     doc.text(sanitizeString(ligne.produit?.emplacement || 'N/A'), x, y, {
  //       width: columnWidths[3],
  //       align: 'center',
  //     });
  //     y += this.ROW_HEIGHT;
  //   });

  //   doc
  //     .moveTo(tableLeft, y)
  //     .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y)
  //     .stroke();

  //   // Résumé
  //   const summaryTop = y + 20 > this.MAX_Y ? (doc.addPage(), 40) : y + 20;
  //   doc.fontSize(10).font('Helvetica-Bold');
  //   doc.text('Résumé', this.MARGINS, summaryTop);
  //   doc.fontSize(8).font('Helvetica');
  //   doc.text(
  //     `Nombre d'articles: ${commande.lignes.length}`,
  //     this.MARGINS,
  //     summaryTop + 15,
  //   );
  //   doc.text('Le Gestionnaire', this.MARGINS, summaryTop + 30, {
  //     underline: true,
  //   });
  //   doc
  //     .moveTo(this.MARGINS, summaryTop + 50)
  //     .lineTo(this.PAGE_WIDTH - this.MARGINS, summaryTop + 50)
  //     .stroke();
  // }

  private drawTableHeader(
    doc: PDFDocument,
    tableTop: number,
    tableLeft: number,
    columnWidths: number[],
    headers: string[],
  ): void {
    doc.fontSize(8).font('Helvetica-Bold');
    let x = tableLeft;
    headers.forEach((header, i) => {
      doc.text(header, x, tableTop, {
        width: columnWidths[i],
        align: 'center',
      });
      x += columnWidths[i];
    });
    doc
      .moveTo(tableLeft, tableTop + 20)
      .lineTo(
        tableLeft + columnWidths.reduce((a, b) => a + b, 0),
        tableTop + 20,
      )
      .stroke();
  }

  private calculateFinancials(commande: any) {
    const montantInitial = commande.lignes.reduce(
      (sum: number, ligne: any) => sum + ligne.prix_vente * ligne.quantite,
      0,
    );
    const remise = commande.remise || 0;
    const montantApresRemise = montantInitial - remise;
    const tva = commande.tva || 0;
    const precompte = montantInitial * 0.02;
    const timbreFiscal = 200;
    const totalTTC = montantApresRemise + tva + precompte + timbreFiscal;

    return {
      montantInitial: Number(montantInitial.toFixed(2)),
      remise: Number(remise.toFixed(2)),
      montantApresRemise: Number(montantApresRemise.toFixed(2)),
      tva: Number(tva.toFixed(2)),
      precompte: Number(precompte.toFixed(2)),
      timbreFiscal: Number(timbreFiscal.toFixed(2)),
      totalTTC: Number(totalTTC.toFixed(2)),
    };
  }

  private drawSummary(
    doc: PDFDocument,
    summaryTop: number,
    financials: any,
    commande: any,
  ): void {
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Résumé', this.MARGINS, summaryTop);
    doc.fontSize(8).font('Helvetica');
    doc.text(
      `Montant HT: ${financials.montantInitial} CFA`,
      this.MARGINS + 300,
      summaryTop + 10,
      { align: 'right' },
    );
    doc.text(
      `Remise: ${financials.remise} CFA`,
      this.MARGINS + 300,
      summaryTop + 25,
      { align: 'right' },
    );
    doc.text(
      `Montant après remise: ${financials.montantApresRemise} CFA`,
      this.MARGINS + 300,
      summaryTop + 40,
      { align: 'right' },
    );
    doc.text(
      `TVA: ${financials.tva} CFA`,
      this.MARGINS + 300,
      summaryTop + 55,
      { align: 'right' },
    );
    doc.text(
      `Précompte BIC [A] 2%: ${financials.precompte} CFA`,
      this.MARGINS + 300,
      summaryTop + 70,
      { align: 'right' },
    );
    doc.text(
      `Timbre Fiscal: ${financials.timbreFiscal} CFA`,
      this.MARGINS + 300,
      summaryTop + 85,
      { align: 'right' },
    );
    doc.text(
      `Total TTC: ${financials.totalTTC} CFA`,
      this.MARGINS + 300,
      summaryTop + 100,
      { align: 'right' },
    );
    doc.text(
      `Moyen de paiement: ${sanitizeString(this.typeReglementMapping[commande.type_reglement] || commande.type_reglement)}`,
      this.MARGINS + 300,
      summaryTop + 115,
      { align: 'right' },
    );
    doc.text(
      `Nombre d'articles: ${commande.lignes.length}`,
      this.MARGINS + 300,
      summaryTop + 130,
      { align: 'right' },
    );
    doc.text('* Montants en francs CFA', this.MARGINS + 300, summaryTop + 145, {
      align: 'right',
    });
    doc.text(
      `Arrêté la présente facture à ${numberToWordsFr(financials.totalTTC)} francs CFA`,
      this.MARGINS,
      summaryTop + 160,
    );
    doc.text('Le Gestionnaire', this.MARGINS, summaryTop + 175, {
      underline: true,
    });
    doc
      .moveTo(this.MARGINS, summaryTop + 190)
      .lineTo(this.PAGE_WIDTH - this.MARGINS, summaryTop + 190)
      .stroke();
  }

  private drawSimpleSummary(
    doc: PDFDocument,
    summaryTop: number,
    financials: any,
  ): void {
    let y = summaryTop;
    doc.fontSize(9).font('Helvetica');
    doc.text(`Montant HT: ${financials.montantInitial} CFA`, 350, y, {
      align: 'right',
    });
    if (financials.remise > 0) {
      y += 15;
      doc.text(`Remise: ${financials.remise} CFA`, 350, y, { align: 'right' });
    }
    y += 15;
    doc.text(`TVA: ${financials.tva} CFA`, 350, y, { align: 'right' });
    y += 15;
    doc.text(`Précompte: ${financials.precompte} CFA`, 350, y, {
      align: 'right',
    });
    y += 15;
    doc.text(`Timbre: ${financials.timbreFiscal} CFA`, 350, y, {
      align: 'right',
    });
    y += 20;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`TOTAL TTC: ${financials.totalTTC} CFA`, 350, y, {
      align: 'right',
    });
  }

  async findAll(
    startDate?: string,
    endDate?: string,
    idClient?: number,
    numeroFacture?: string,
  ): Promise<CommandeVente[]> {
    // Log input parameters
    console.log('findAll parameters:', {
      startDate,
      endDate,
      idClient,
      numeroFacture,
    });

    const where: any = { type_facture: 'FV', statut: 0 };
    if (startDate && endDate) {
      where.date_commande_vente = Between(
        new Date(startDate),
        new Date(endDate),
      );
    }
    if (idClient) {
      where.id_client = idClient;
    }
    if (numeroFacture) {
      // where.id_commande_vente = Like(`%${numeroFacture}%`);
      where.id_commande_vente = numeroFacture;
    }

    // Log the query conditions
    console.log('Query conditions:', where);

    try {
      const result = await this.commandeVenteRepository.find({
        where,
        relations: ['client'],
        select: [
          'id_commande_vente',
          'date_commande_vente',
          'numero_seq',
          'numero_facture_certifiee',
          'montant_total',
          'id_client',
        ],
        order: { date_commande_vente: 'DESC' },
      });

      // Log the result
      console.log('Factures:', result);
      return result;
    } catch (error) {
      // Log the error
      console.log('Error fetching factures in findAll:', error);
      throw new BadRequestException('Erreur lors du chargement des factures.');
    }
  }

  async findOne(id: number): Promise<CommandeVente> {
    const entity = await this.commandeVenteRepository.findOne({
      where: { id_commande_vente: id },
      relations: ['client', 'lignes'],
    });
    if (!entity) throw new NotFoundException('CommandeVente non trouvée');
    return entity;
  }

  async create(dto: CreateCommandeVenteDto): Promise<CommandeVente> {
    console.log('Payload reçu:', JSON.stringify(dto, null, 2));

    return this.commandeVenteRepository.manager.transaction(async (manager) => {
      try {
        // Valider le client
        const client = await manager.findOneBy(Client, {
          id_client: dto.id_client,
        });
        if (!client) {
          throw new BadRequestException(
            `Client avec id ${dto.id_client} non trouvé`,
          );
        }

        // Gérer l'ISB selon le type_isb
        let isbRate = 0;
        if (dto.type_isb) {
          // Récupérer le taux ISB depuis la base
          const isbs = await manager.find(Isb, { select: ['isb', 'taux'] });
          const isbRecord = isbs.find((isb) => isb.isb === dto.type_isb);
          if (isbRecord) {
            isbRate = parseFloat(isbRecord.taux) || 0;
          } else {
            // Mapping par défaut si pas trouvé en DB
            const isbMapping: { [key: string]: number } = {
              '0%': 0,
              '2%': 0.02,
              '5%': 0.05,
            };
            isbRate = isbMapping[dto.type_isb] || 0.02; // 2% par défaut
          }
        }
        console.log('Taux ISB appliqué:', isbRate, 'pour type:', dto.type_isb);

        // TVA : utiliser celle fournie ou 0
        const tvaCommande =
          dto.tva != null && !isNaN(dto.tva) && dto.tva >= 0 ? dto.tva : 0;
        console.log('TVA générale appliquée:', tvaCommande, '%');

        // Génération numéro facture
        const currentYear = new Date().getFullYear();
        const lastCommande = await manager.findOne(CommandeVente, {
          where: {
            type_facture: 'FV',
            numero_facture_certifiee: Like(`%-${currentYear}`),
          },
          order: { numero_seq: 'DESC' },
        });
        const numero_seq = lastCommande ? lastCommande.numero_seq + 1 : 1;
        const numero_facture_certifiee = `${numero_seq.toString().padStart(4, '0')}-${currentYear}`;

        // Vérifier unicité
        const existingCommande = await manager.findOne(CommandeVente, {
          where: { numero_facture_certifiee },
        });
        if (existingCommande) {
          throw new BadRequestException(
            `Une commande existe déjà avec le numéro de facture ${numero_facture_certifiee}`,
          );
        }

        // Créer la commande (temporairement avec valeurs par défaut)
        const commande = manager.create(CommandeVente, {
          date_commande_vente: new Date(dto.date_commande_vente),
          montant_total: 0, // Sera calculé
          montant_paye: 0,
          montant_restant: 0, // Sera calculé
          remise: 0, // Sera calculé
          validee: 1,
          statut: 0,
          id_client: dto.id_client,
          client,
          reglee: 0,
          moyen_reglement: 0,
          type_reglement: dto.type_reglement || 'E',
          tva: 0, // Sera le montant TVA calculé
          type_isb: dto.type_isb || '2%',
          isb: 0, // Sera calculé
          avoir: 0,
          login: dto.login,
          type_facture: 'FV',
          reponse_mcf: '',
          qrcode: '',
          client_vd: dto.client_vd || '',
          nif_vd: dto.nif_vd || '',
          adresse_vd: dto.adresse_vd || '',
          telephone_vd: dto.telephone_vd || '',
          email_vd: dto.email_vd || '',
          ville_vd: dto.ville_vd || '',
          commentaire1: dto.commentaire1 || '',
          commentaire2: dto.commentaire2 || '',
          commentaire3: dto.commentaire3 || '',
          commentaire4: dto.commentaire4 || '',
          commentaire5: dto.commentaire5 || '',
          commentaire6: dto.commentaire6 || '',
          commentaire7: dto.commentaire7 || '',
          commentaire8: dto.commentaire8 || '',
          certifiee: 'NON',
          counter_per_receipt_type: '',
          total_receipt_counter: '',
          receipt_type: '',
          process_date_and_time: '',
          device_dentification: '',
          nif_: '',
          signature: '',
          ref_ini: '',
          exoneration: '',
          numero_seq,
          numero_facture_certifiee,
          imprimee: 1,
          escompte: 0,
        });

        const savedCommande = await manager.save(CommandeVente, commande);
        console.log(
          `Commande sauvegardée avec id: ${savedCommande.id_commande_vente}`,
        );

        // Traitement des lignes - CALCULER D'ABORD LE MONTANT HT TOTAL
        let montant_ht_total = 0; // Total HT (prix * quantité)
        let montant_tva_total = 0; // Montant TVA calculé
        const savedLignes: LignesCommandeVente[] = [];

        for (const ligne of dto.lignes) {
          const produit = await manager.findOneBy(Produit, {
            id_produit: ligne.id_produit,
          });
          if (!produit) {
            throw new BadRequestException(
              `Produit avec id ${ligne.id_produit} non trouvé`,
            );
          }
          if (ligne.quantite <= 0 || ligne.quantite > produit.stock_courant) {
            throw new BadRequestException(
              `Quantité invalide pour produit ${ligne.id_produit}: ${ligne.quantite}. Stock disponible: ${produit.stock_courant}`,
            );
          }

          const prix_vente = ligne.prix_vente ?? produit.prix_unitaire;
          const montant_ligne_ht = prix_vente * ligne.quantite; // Montant HT de la ligne

          // Accumulation du montant HT total
          montant_ht_total += montant_ligne_ht;

          console.log(`Ligne ${ligne.id_produit}:`, {
            prix_unitaire: prix_vente,
            quantite: ligne.quantite,
            montant_ht: montant_ligne_ht,
          });

          const ligneDto: CreateLignesCommandeVenteDto = {
            id_produit: ligne.id_produit,
            prix_vente,
            remise: 0, // Pas de remise au niveau ligne
            description_remise: 'Aucune',
            prix_vente_avant_remise: prix_vente.toString(),
            quantite: ligne.quantite,
            group_tva: produit.group_tva ?? '',
            etiquette_tva: produit.etiquette_tva ?? '',
            taux_tva: tvaCommande,
            isb_ligne: 0, // ISB géré au niveau commande
            date: ligne.date ?? dto.date_commande_vente,
          };

          const savedLigne = await this.lignesCommandeVenteService.create(
            ligneDto,
            savedCommande.id_commande_vente,
            dto.login,
          );
          savedLignes.push(savedLigne);
        }

        // MAINTENANT CALCULER LA REMISE (après avoir le montant HT total)
        let montant_remise = 0;
        const remiseFrontend =
          dto.remise != null && !isNaN(dto.remise) && dto.remise >= 0
            ? dto.remise
            : 0;

        if (remiseFrontend > 0) {
          if (remiseFrontend < 1) {
            // C'est un taux (ex: 0.02 = 2%)
            montant_remise = montant_ht_total * remiseFrontend;
            console.log(
              `Remise calculée: ${montant_ht_total} × ${remiseFrontend} = ${montant_remise} CFA`,
            );
          } else {
            // C'est un montant fixe
            montant_remise = remiseFrontend;
            console.log(`Remise fixe: ${montant_remise} CFA`);
          }
        }

        console.log('Remise appliquée:', montant_remise, 'CFA');

        // Calcul ISB/Précompte sur le montant HT APRÈS remise
        const montant_ht_apres_remise = montant_ht_total - montant_remise;
        const montant_isb = montant_ht_apres_remise * isbRate;

        // Calculer TVA sur le montant après remise
        if (tvaCommande > 0) {
          montant_tva_total = montant_ht_apres_remise * (tvaCommande / 100);
        }

        // Calculs finaux
        const timbre_fiscal = 200; // Fixe

        // Calcul du total : (HT - Remise) + TVA + ISB + Timbre
        const montant_total_final =
          montant_ht_apres_remise +
          montant_tva_total +
          montant_isb +
          timbre_fiscal;

        console.log('Calculs finaux:', {
          montant_ht_initial: montant_ht_total,
          remise: montant_remise,
          montant_ht_apres_remise: montant_ht_apres_remise,
          montant_tva: montant_tva_total,
          montant_isb: montant_isb,
          timbre_fiscal: timbre_fiscal,
          total_final: montant_total_final,
        });

        // Mise à jour de la commande
        await manager.update(
          CommandeVente,
          { id_commande_vente: savedCommande.id_commande_vente },
          {
            montant_total: montant_total_final,
            montant_restant: montant_total_final,
            tva: montant_tva_total, // Montant TVA calculé
            isb: montant_isb, // Montant ISB calculé
            remise: montant_remise, // Montant remise calculé
          },
        );

        // Mise à jour objet retourné
        savedCommande.montant_total = montant_total_final;
        savedCommande.montant_restant = montant_total_final;
        savedCommande.tva = montant_tva_total;
        savedCommande.isb = montant_isb;
        savedCommande.remise = montant_remise;
        savedCommande.lignes = savedLignes;

        return savedCommande;
      } catch (error) {
        console.error('Erreur dans la transaction:', error);
        throw error;
      }
    });
  }

  async cancelCommandeVente(
    id_commande_vente: number,
    login: string,
  ): Promise<void> {
    return this.commandeVenteRepository.manager.transaction(async (manager) => {
      try {
        // Étape 1 : Récupérer la commande avec ses relations
        const commande = await manager.findOne(CommandeVente, {
          where: { id_commande_vente, type_facture: 'FV' },
          relations: ['client', 'lignes', 'lignes.produit'],
        });
        if (!commande) {
          throw new NotFoundException(
            `Facture de vente avec ID ${id_commande_vente} non trouvée`,
          );
        }
        if (commande.statut === 2) {
          throw new BadRequestException(
            `Facture ${id_commande_vente} déjà annulée`,
          );
        }
        if (commande.validee !== 1) {
          throw new BadRequestException(
            `Facture ${id_commande_vente} non validée, impossible d'annuler`,
          );
        }
        if (commande.montant_paye > 0) {
          throw new BadRequestException(
            `Facture ${id_commande_vente} a des paiements enregistrés, impossible d'annuler`,
          );
        }

        // Étape 2 : Valider le client
        const client = await manager.findOneBy(Client, {
          id_client: commande.id_client,
        });
        if (!client) {
          throw new BadRequestException(
            `Client avec ID ${commande.id_client} non trouvé`,
          );
        }

        // Étape 3 : Restaurer le stock pour chaque ligne
        for (const ligne of commande.lignes) {
          const produit = await manager.findOneBy(Produit, {
            id_produit: ligne.designation,
          });
          if (!produit) {
            throw new BadRequestException(
              `Produit avec ID ${ligne.designation} non trouvé`,
            );
          }

          const stockActuel = produit.stock_courant || 0;
          const newStock = stockActuel + ligne.quantite;

          // Mettre à jour le stock du produit
          await manager.update(
            Produit,
            { id_produit: ligne.designation },
            { stock_courant: newStock },
          );

          // Créer une entrée MMvtStock pour le retour
          const mvtStock = manager.create(MMvtStock, {
            id_produit: ligne.designation,
            quantite: ligne.quantite, // Quantité positive pour restaurer
            quantite_commandee: 0,
            cout: produit.prix_unitaire || 0,
            date: new Date(),
            user: login || 'Inconnu',
            type: 3, // Type pour retour de stock
            magasin: 1, // Ajuste selon ta logique
            commentaire: `Annulation de la facture de vente N° ${id_commande_vente}`,
            stock_avant: stockActuel,
            stock_apres: newStock,
            id_commande_vente,
            annule: 'N',
            num_lot: '', // Pas dans LignesCommandeVente, laissé vide
            date_expiration: null, // Pas dans LignesCommandeVente, laissé null
            conformite: 'O',
          });
          await manager.save(MMvtStock, mvtStock);

          // Mettre à jour le stock capture
          await this.captureStockService.updateStockCapture(
            ligne.designation,
            newStock,
          );
        }

        // Étape 4 : Marquer la commande comme annulée
        await manager.update(
          CommandeVente,
          { id_commande_vente },
          {
            statut: 1, // Statut annulé
            montant_total: 0,
            montant_restant: 0,
            tva: 0,
            isb: 0,
            // date_modification: new Date(), // Ajoute ce champ si tu modifies l'entité
          },
        );

        // Étape 5 : Enregistrer un log
        const logEntry = manager.create(Log, {
          log: `Annulation de la facture de vente N° ${id_commande_vente} par ${login}`,
          date: new Date(),
          user: login || 'Inconnu',
          archive: 1,
        });
        await manager.save(Log, logEntry);

        console.log(`Facture ${id_commande_vente} annulée avec succès`);
      } catch (error) {
        console.error(
          'Erreur lors de l’annulation:',
          JSON.stringify(error, null, 2),
        );
        throw error;
      }
    });
  }

  private typeReglementMapping: { [key: string]: string } = {
    E: 'ESPECES',
    V: 'VIREMENT',
    C: 'CARTE BANCAIRE',
    Q: 'CHEQUE BANCAIRE',
    M: 'MONNAIE ELECTRONIQUE',
    A: 'AUTRE',
  };
  // Autres méthodes inchangées

  async update(
    id: number,
    dto: UpdateCommandeVenteDto,
  ): Promise<CommandeVente> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.commandeVenteRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);
    await this.commandeVenteRepository.remove(entity);
  }

  async getAllSales(): Promise<{
    data: SaleDto[];
    total_montant: number;
    count: number;
  }> {
    const queryBuilder = this.commandeVenteRepository
      .createQueryBuilder('cv')
      .innerJoin('cv.lignes', 'lcv')
      .innerJoin('client', 'c', 'cv.id_client = c.id_client')
      .innerJoin('produit', 'p', 'lcv.designation = p.id_produit')
      .select([
        'cv.id_commande_vente AS id_commande_vente',
        'cv.date_commande_vente AS date_commande_vente',
        'c.nom AS nom_client',
        'p.produit AS nom_produit',
        'lcv.quantite AS quantite',
        'lcv.prix_vente AS prix_unitaire',
        'lcv.montant AS montant_ligne',
        'cv.montant_total AS montant_commande',
      ])
      .orderBy('cv.date_commande_vente', 'DESC');

    const sales = await queryBuilder.getRawMany();

    if (!sales.length) {
      throw new NotFoundException('Aucune donnée de vente trouvée.');
    }

    const totalMontant = sales.reduce(
      (sum, sale) => sum + (sale.montant_ligne || 0),
      0,
    );

    return {
      data: sales,
      total_montant: totalMontant,
      count: sales.length,
    };
  }

  async getSalesByDateRange(
    date_debut: string,
    date_fin: string,
    limit: number,
  ): Promise<{
    data: SaleDto[];
    total_montant: number;
    periode: string;
    count: number;
  }> {
    const queryBuilder = this.commandeVenteRepository
      .createQueryBuilder('cv')
      .innerJoin('cv.lignes', 'lcv')
      .leftJoin('client', 'c', 'cv.id_client = c.id_client') // Changé en LEFT JOIN
      .innerJoin('produit', 'p', 'lcv.designation = p.id_produit')
      .select([
        'p.produit AS nom_produit',
        'p.presentation AS presentation',
        'SUM(lcv.quantite) AS quantite',
        'AVG(lcv.prix_vente) AS prix_unitaire',
        'SUM(lcv.montant) AS montant_ligne',
      ])
      .where('cv.date_commande_vente BETWEEN :dateDebut AND :dateFin', {
        dateDebut: `${date_debut} 00:00:00`,
        dateFin: `${date_fin} 23:59:59`,
      })
      .andWhere('p.produit != :timbre', { timbre: 'Timbre fiscale' })
      .groupBy('p.produit, p.presentation')
      .orderBy('p.produit', 'ASC')
      .take(limit);

    const sales = await queryBuilder.getRawMany();

    if (!sales.length) {
      throw new NotFoundException(
        `Aucune donnée pour la période du ${date_debut} au ${date_fin}`,
      );
    }

    const totalMontant = sales.reduce(
      (sum, sale) => sum + (sale.montant_ligne || 0),
      0,
    );

    return {
      data: sales,
      total_montant: totalMontant,
      periode: `du ${date_debut} au ${date_fin}`,
      count: sales.length,
    };
  }
  // async getSalesByDateRange(
  //   date_debut: string,
  //   date_fin: string,
  //   limit: number,
  // ): Promise<{
  //   data: SaleDto[];
  //   total_montant: number;
  //   periode: string;
  //   count: number;
  // }> {
  //   const queryBuilder = this.commandeVenteRepository
  //     .createQueryBuilder('cv')
  //     .innerJoin('cv.lignes', 'lcv')
  //     .innerJoin('client', 'c', 'cv.id_client = c.id_client')
  //     .innerJoin('produit', 'p', 'lcv.designation = p.id_produit')
  //     .select([
  //       'p.produit AS nom_produit',
  //       'p.presentation AS presentation',
  //       'SUM(lcv.quantite) AS quantite',
  //       'AVG(lcv.prix_vente) AS prix_unitaire',
  //       'SUM(lcv.montant) AS montant_ligne',
  //     ])
  //     .where('cv.date_commande_vente BETWEEN :dateDebut AND :dateFin', {
  //       dateDebut: `${date_debut} 00:00:00`,
  //       dateFin: `${date_fin} 23:59:59`,
  //     })
  //     .andWhere('p.produit != :timbre', { timbre: 'Timbre fiscale' }) // Exclure Timbre fiscale
  //     .groupBy('p.produit, p.presentation')
  //     .orderBy('p.produit', 'ASC')
  //     .take(limit);

  //   const sales = await queryBuilder.getRawMany();

  //   if (!sales.length) {
  //     throw new NotFoundException(
  //       `Aucune donnée pour la période du ${date_debut} au ${date_fin}`,
  //     );
  //   }

  //   const totalMontant = sales.reduce(
  //     (sum, sale) => sum + (sale.montant_ligne || 0),
  //     0,
  //   );

  //   return {
  //     data: sales,
  //     total_montant: totalMontant,
  //     periode: `du ${date_debut} au ${date_fin}`,
  //     count: sales.length,
  //   };
  // }

  async getSalesReport(
    startDate: string,
    endDate: string,
    reportType: 'ca' | 'quantity',
    supplierId?: number,
  ): Promise<{
    data: { fournisseur: string; produits: any[] }[];
    total: number;
    periode: string;
    count: number;
  }> {
    console.log('getSalesReport called with:', {
      startDate,
      endDate,
      reportType,
      supplierId,
    });

    const queryBuilder = this.commandeVenteRepository
      .createQueryBuilder('cv')
      .innerJoin('cv.lignes', 'lcv')
      .innerJoin('produit', 'p', 'lcv.designation = p.id_produit')
      .leftJoin(
        'titulaire_amm',
        't',
        'p.cle_titulaire_amm = t.id_titulaire_amm',
      )
      .select([
        'COALESCE(t.titulaire_amm, "Inconnu") AS fournisseur',
        'p.produit AS nom_produit',
        'p.denomination_commune_internationale AS denomination',
        'p.dosage AS dosage',
      ])
      .where('cv.date_commande_vente BETWEEN :startDate AND :endDate', {
        startDate: `${startDate} 00:00:00`,
        endDate: `${endDate} 23:59:59`,
      })
      .andWhere('p.produit != :timbre', { timbre: 'Timbre fiscale' });

    if (supplierId) {
      queryBuilder.andWhere('p.cle_titulaire_amm = :supplierId', {
        supplierId: Number(supplierId),
      });
    }

    if (reportType === 'ca') {
      queryBuilder.addSelect('SUM(lcv.montant) AS chiffre_affaire');
    } else {
      queryBuilder.addSelect('SUM(lcv.quantite) AS quantite_vendue');
    }

    queryBuilder
      .groupBy(
        't.titulaire_amm, p.produit, p.denomination_commune_internationale, p.dosage',
      )
      .orderBy('t.titulaire_amm', 'ASC')
      .addOrderBy('p.produit', 'ASC');

    const sales = await queryBuilder.getRawMany();
    console.log('Raw sales data:', sales);

    const groupedData = sales.reduce(
      (acc, sale) => {
        const fournisseur = sale.fournisseur || 'Inconnu';
        if (!acc[fournisseur]) {
          acc[fournisseur] = [];
        }
        acc[fournisseur].push({
          nom_produit: sale.nom_produit,
          denomination: sale.denomination,
          dosage: sale.dosage,
          [reportType === 'ca' ? 'chiffre_affaire' : 'quantite_vendue']:
            reportType === 'ca'
              ? Number(sale.chiffre_affaire || 0)
              : Number(sale.quantite_vendue || 0),
        });
        return acc;
      },
      {} as { [key: string]: any[] },
    );

    const data = Object.keys(groupedData).map((fournisseur) => ({
      fournisseur,
      produits: groupedData[fournisseur],
    }));

    const total = sales.reduce(
      (sum, sale) =>
        sum +
        (reportType === 'ca'
          ? Number(sale.chiffre_affaire || 0)
          : Number(sale.quantite_vendue || 0)),
      0,
    );

    return {
      data,
      total,
      periode: `du ${startDate} au ${endDate}`,
      count: sales.length,
    };
  }

  async getInvoicesByClient(
    startDate: string,
    endDate: string,
  ): Promise<{
    data: ClientInvoice[];
    periode: string;
  }> {
    console.log('getInvoicesByClient called with:', { startDate, endDate });

    try {
      const queryBuilder = this.commandeVenteRepository
        .createQueryBuilder('cv')
        .innerJoin('cv.lignes', 'lcv')
        .leftJoin('produit', 'p', 'lcv.designation = p.id_produit') // Corrigé: jointure sur id_produit
        .leftJoin('client', 'c', 'cv.id_client = c.id_client')
        .leftJoin('cv.reglements', 'r') // Ajouté: jointure sur règlements
        .select([
          'COALESCE(c.nom, "Client Inconnu") AS client_nom',
          'cv.id_commande_vente AS numero_commande',
          'COALESCE(p.produit, lcv.designation) AS designation',
          'lcv.quantite AS quantite',
          'CASE WHEN lcv.quantite > 0 THEN lcv.montant / lcv.quantite ELSE 0 END AS prix_unitaire', // Éviter division par zéro
          'lcv.montant AS montant_ligne',
          'SUM(COALESCE(r.montant, 0)) AS montant_regle', // Calcul montant réglé
        ])
        .where('cv.date_commande_vente BETWEEN :startDate AND :endDate', {
          startDate: `${startDate} 00:00:00`,
          endDate: `${endDate} 23:59:59`,
        })
        .groupBy(
          'c.nom, cv.id_commande_vente, lcv.designation, lcv.quantite, lcv.montant',
        ) // Groupement pour montant_regle
        .orderBy('c.nom', 'ASC')
        .addOrderBy('cv.id_commande_vente', 'ASC')
        .addOrderBy('lcv.designation', 'ASC');

      console.log('Query SQL:', queryBuilder.getSql());

      const invoices = await queryBuilder.getRawMany();
      console.log('Raw invoice data:', invoices);

      const groupedData: { [key: string]: { [key: number]: InvoiceCommande } } =
        invoices.reduce((acc, item) => {
          const client = item.client_nom || 'Client Inconnu';
          if (!acc[client]) {
            acc[client] = {};
          }
          const commandeId = item.numero_commande;
          if (!acc[client][commandeId]) {
            acc[client][commandeId] = {
              numero_commande: commandeId,
              lignes: [],
              total: 0,
              montant_regle: Number(item.montant_regle || 0),
              montant_restant: 0,
            };
          }
          acc[client][commandeId].lignes.push({
            designation: item.designation,
            quantite: Number(item.quantite || 1),
            prix_unitaire: Number(item.prix_unitaire || 0),
            montant_ligne: Number(item.montant_ligne || 0),
          });
          acc[client][commandeId].total += Number(item.montant_ligne || 0);
          acc[client][commandeId].montant_restant =
            acc[client][commandeId].total -
            acc[client][commandeId].montant_regle;
          return acc;
        }, {});

      const data: ClientInvoice[] = Object.keys(groupedData).map((client) => ({
        client,
        commandes: Object.values(groupedData[client]),
      }));

      console.log('Grouped data:', data);

      return {
        data,
        periode: `du ${startDate} au ${endDate}`,
      };
    } catch (error) {
      console.log('Error in getInvoicesByClient:', error);
      throw new BadRequestException('Erreur lors du chargement des factures.');
    }
  }

  // async exportInvoicesToExcel(startDate: string, endDate: string) {
  //   console.log('exportInvoicesToExcel called with:', { startDate, endDate });
  //   const invoices = await this.getInvoicesByClient(startDate, endDate);
  //   console.log('Invoices data:', invoices.data);
  //   if (!invoices.data || invoices.data.length === 0) {
  //     throw new Error('No data to export');
  //   }
  //   const workbook = new ExcelJS.Workbook();
  //   invoices.data.forEach((clientData) => {
  //     const worksheet = workbook.addWorksheet(
  //       clientData.client || 'Client Inconnu',
  //     );
  //     clientData.commandes.forEach((commande, index) => {
  //       worksheet.addRow([`Facture N°: ${commande.numero_commande}`]);
  //       worksheet.addRow([]);
  //       worksheet.addRow(['Désignation', 'Quantité', 'Pu', 'Montant ligne']);
  //       commande.lignes.forEach((ligne) => {
  //         worksheet.addRow([
  //           ligne.designation,
  //           ligne.quantite,
  //           ligne.prix_unitaire,
  //           ligne.montant_ligne,
  //         ]);
  //       });
  //       worksheet.addRow([]);
  //       worksheet.addRow(['Total', '', '', commande.total]);
  //       worksheet.addRow(['Montant réglé', '', '', commande.montant_regle]);
  //       worksheet.addRow(['Montant restant', '', '', commande.montant_restant]);
  //       if (index < clientData.commandes.length - 1) {
  //         worksheet.addRow([]);
  //       }
  //     });
  //     worksheet.getRow(1).font = { bold: true, size: 14 };
  //     worksheet.getRow(3).font = { bold: true };
  //     worksheet.columns = [
  //       { width: 30 },
  //       { width: 10 },
  //       { width: 10 },
  //       { width: 15 },
  //     ];
  //   });
  //   const buffer = await workbook.xlsx.writeBuffer();
  //   //  console.log('Excel buffer size:', buffer.length);
  //   return 'buffer';
  // }

  async exportInvoicesToExcel(startDate: string, endDate: string) {
    console.log('exportInvoicesToExcel called with:', { startDate, endDate });
    const invoices = await this.getInvoicesByClient(startDate, endDate);
    console.log('Invoices data:', invoices.data);
    if (!invoices.data || invoices.data.length === 0) {
      throw new Error('No data to export');
    }
    const workbook = new ExcelJS.Workbook();
    invoices.data.forEach((clientData) => {
      const worksheet = workbook.addWorksheet(
        clientData.client || 'Client Inconnu',
      );
      clientData.commandes.forEach((commande, index) => {
        worksheet.addRow([`Facture N°: ${commande.numero_commande}`]);
        worksheet.addRow([]);
        worksheet.addRow(['Désignation', 'Quantité', 'Pu', 'Montant ligne']);
        commande.lignes.forEach((ligne) => {
          worksheet.addRow([
            ligne.designation,
            ligne.quantite,
            ligne.prix_unitaire,
            ligne.montant_ligne,
          ]);
        });
        // Add fiscal stamp row
        const fiscalStamp = 200;
        worksheet.addRow(['Timbre fiscal', '', '', fiscalStamp]);
        worksheet.addRow([]);
        // Update total to include fiscal stamp
        const updatedTotal = commande.total + fiscalStamp;
        worksheet.addRow(['Total', '', '', updatedTotal]);
        worksheet.addRow(['Montant réglé', '', '', commande.montant_regle]);
        worksheet.addRow(['Montant restant', '', '', commande.montant_restant]);
        if (index < clientData.commandes.length - 1) {
          worksheet.addRow([]);
        }
      });
      // Apply formatting
      worksheet.getRow(1).font = { bold: true, size: 14 };
      worksheet.getRow(3).font = { bold: true };
      worksheet.columns = [
        { width: 30 },
        { width: 10 },
        { width: 10 },
        { width: 15 },
      ];
    });
    const buffer = await workbook.xlsx.writeBuffer();
    // console.log('Excel buffer size:', buffer.length);
    return 'buffer';
  }

  async getDailySalesSummary(date: string): Promise<{
    totalVentes: number;
    totalFactures: number;
    totalRegle: number;
    totalEnAttente: number;
  }> {
    console.log('getDailySalesSummary called with:', { date });

    // Valider la date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error('Invalid date format received:', date);
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.error('Invalid date value received:', date);
      throw new BadRequestException('Invalid date value.');
    }

    const queryBuilder = this.commandeVenteRepository
      .createQueryBuilder('cv')
      .leftJoin('cv.lignes', 'lcv')
      .select([
        'COUNT(DISTINCT cv.id_commande_vente) AS total_factures',
        'COALESCE(SUM(lcv.montant), 0) AS total_ventes',
        'COALESCE(SUM(cv.montant_paye), 0) AS total_regle',
      ])
      .where('DATE(cv.date_commande_vente) = :date', { date });

    console.log('Executing query with date:', date);
    const result = await queryBuilder.getRawOne().catch((error) => {
      console.error('Query failed:', error);
      throw error;
    });
    console.log('Raw summary data:', result);

    const totalVentes = Number(result.total_ventes || 0);
    const totalFactures = Number(result.total_factures || 0);
    const totalRegle = Number(result.total_regle || 0);
    const totalEnAttente = totalVentes - totalRegle;

    return {
      totalVentes,
      totalFactures,
      totalRegle,
      totalEnAttente,
    };
  }

  async getGlobalSalesSummary(
    year: string,
    clientId?: number,
  ): Promise<{
    summary: {
      totalVentes: number;
      totalFactures: number;
      totalRegle: number;
      totalEnAttente: number;
    };
    byClient: Array<{
      client: string;
      totalAmount: number;
      paidAmount: number;
      remainingAmount: number;
      totalFactures: number;
    }>;
  }> {
    console.log('getGlobalSalesSummary called with:', { year, clientId });

    if (!year || !/^\d{4}$/.test(year)) {
      console.error('Invalid year format received:', year);
      throw new BadRequestException('Invalid year format. Use YYYY.');
    }

    const parsedYear = Number(year);
    if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 9999) {
      console.error('Invalid year value received:', year);
      throw new BadRequestException('Invalid year value.');
    }

    try {
      const queryBuilder = this.commandeVenteRepository
        .createQueryBuilder('cv')
        .leftJoin('client', 'c', 'cv.id_client = c.id_client')
        .select([
          'c.nom AS client_name',
          'COUNT(DISTINCT cv.id_commande_vente) AS total_factures',
          'COALESCE(SUM(cv.montant_total), 0) AS total_ventes',
          'COALESCE(SUM(cv.montant_paye), 0) AS total_regle',
        ])
        .where('YEAR(cv.date_commande_vente) = :year', { year: parsedYear })
        .andWhere('cv.validee = :validee', { validee: 1 })
        .andWhere('cv.avoir = :avoir', { avoir: 0 });

      if (clientId) {
        queryBuilder.andWhere('c.id_client = :clientId', { clientId });
      }

      queryBuilder.groupBy('c.id_client, c.nom');

      console.log(
        'Executing client query:',
        queryBuilder.getQueryAndParameters(),
      );
      const clientResults = await queryBuilder.getRawMany();
      console.log('Raw client data:', clientResults);

      const totalQueryBuilder = this.commandeVenteRepository
        .createQueryBuilder('cv')
        .select([
          'COUNT(DISTINCT cv.id_commande_vente) AS total_factures',
          'COALESCE(SUM(cv.montant_total), 0) AS total_ventes',
          'COALESCE(SUM(cv.montant_paye), 0) AS total_regle',
        ])
        .where('YEAR(cv.date_commande_vente) = :year', { year: parsedYear })
        .andWhere('cv.validee = :validee', { validee: 1 })
        .andWhere('cv.avoir = :avoir', { avoir: 0 });

      if (clientId) {
        totalQueryBuilder.andWhere('cv.id_client = :clientId', { clientId });
      }

      console.log(
        'Executing total query:',
        totalQueryBuilder.getQueryAndParameters(),
      );
      const totalResult = await totalQueryBuilder.getRawOne();
      console.log('Raw total data:', totalResult);

      const totalVentes = Number(totalResult?.total_ventes || 0);
      const totalFactures = Number(totalResult?.total_factures || 0);
      const totalRegle = Number(totalResult?.total_regle || 0);
      const totalEnAttente = totalVentes - totalRegle;

      const byClient = clientResults.map((row) => ({
        client: row.client_name || 'Inconnu',
        totalAmount: Number(row.total_ventes || 0),
        paidAmount: Number(row.total_regle || 0),
        remainingAmount:
          Number(row.total_ventes || 0) - Number(row.total_regle || 0),
        totalFactures: Number(row.total_factures || 0),
      }));

      return {
        summary: {
          totalVentes,
          totalFactures,
          totalRegle,
          totalEnAttente,
        },
        byClient,
      };
    } catch (error) {
      console.error('getGlobalSalesSummary failed:', error);
      throw new InternalServerErrorException(
        `Failed to execute global sales query: ${error.message}`,
      );
    }
  }

  async exportGlobalSalesToExcel(year: string, res: Response): Promise<void> {
    console.log('exportGlobalSalesToExcel called with:', { year });

    if (!year || !/^\d{4}$/.test(year)) {
      console.error('Invalid year format received:', year);
      throw new BadRequestException('Invalid year format. Use YYYY.');
    }

    const parsedYear = Number(year);
    if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 9999) {
      console.error('Invalid year value received:', year);
      throw new BadRequestException('Invalid year value.');
    }

    try {
      const queryBuilder = this.commandeVenteRepository
        .createQueryBuilder('cv')
        .leftJoin('client', 'c', 'cv.id_client = c.id_client')
        .select([
          'c.nom AS client_name',
          'COUNT(DISTINCT cv.id_commande_vente) AS total_factures',
          'COALESCE(SUM(cv.montant_total), 0) AS total_ventes',
          'COALESCE(SUM(cv.montant_paye), 0) AS total_regle',
        ])
        .where('YEAR(cv.date_commande_vente) = :year', { year: parsedYear })
        .andWhere('cv.validee = :validee', { validee: 1 })
        .andWhere('cv.avoir = :avoir', { avoir: 0 })
        .groupBy('c.id_client, c.nom');

      console.log(
        'Executing export query:',
        queryBuilder.getQueryAndParameters(),
      );
      const results = await queryBuilder.getRawMany();
      console.log('Export data:', results);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Ventes ${year}`, {
        properties: { tabColor: { argb: 'FF4CAF50' } },
      });

      worksheet.columns = [
        { header: 'Client', key: 'client_name', width: 30 },
        { header: 'Nombre de Factures', key: 'total_factures', width: 20 },
        { header: 'Total Ventes (FCFA)', key: 'total_ventes', width: 20 },
        { header: 'Montant Payé (FCFA)', key: 'total_regle', width: 20 },
        {
          header: 'Montant Restant (FCFA)',
          key: 'total_en_attente',
          width: 20,
        },
      ];

      worksheet.mergeCells('A1:E1');
      worksheet.getCell('A1').value = `Résumé des Ventes ${year}`;
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      worksheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0F7FA' },
      };

      worksheet.getRow(2).values = [
        'Client',
        'Nombre de Factures',
        'Total Ventes (FCFA)',
        'Montant Payé (FCFA)',
        'Montant Restant (FCFA)',
      ];

      worksheet.getRow(2).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1976D2' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      results.forEach((row) => {
        worksheet.addRow({
          client_name: row.client_name || 'Inconnu',
          total_factures: Number(row.total_factures || 0),
          total_ventes: Number(row.total_ventes || 0),
          total_regle: Number(row.total_regle || 0),
          total_en_attente:
            Number(row.total_ventes || 0) - Number(row.total_regle || 0),
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          });
        }
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=situation_global_${year}.xlsx`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Export query failed:', error);
      throw new InternalServerErrorException(
        `Failed to execute export query: ${error.message}`,
      );
    }
  }

  // Nouvelle méthode pour récupérer les clients
  async getClients(): Promise<{ id: number; name: string }[]> {
    const queryBuilder = this.clientRepository
      .createQueryBuilder('c')
      .select(['c.id_client AS id', 'c.nom AS name']);

    const results = await queryBuilder.getRawMany().catch((error) => {
      console.error('Clients query failed:', error);
      throw error;
    });

    return results.map((row) => ({
      id: Number(row.id || 0),
      name: row.name || 'Inconnu',
    }));
  }

  // Dans CommandeVenteService
  // async getUnpaidInvoices(dto: GetUnpaidInvoicesDto) {
  //   const { id_client, date_debut, date_fin } = dto;

  //   if (!id_client) {
  //     throw new BadRequestException("L'ID du client est requis");
  //   }

  //   // Construire la requête
  //   const query = this.commandeVenteRepository
  //     .createQueryBuilder('commande')
  //     .where('commande.id_client = :id_client', { id_client })
  //     .andWhere('commande.reglee = :reglee', { reglee: 0 }); // Factures non réglées

  //   // Ajouter le filtre par dates si fourni
  //   if (date_debut && date_fin) {
  //     query.andWhere(
  //       'commande.date_commande_vente BETWEEN :date_debut AND :date_fin',
  //       {
  //         date_debut,
  //         date_fin,
  //       },
  //     );
  //   } else if (date_debut) {
  //     query.andWhere('commande.date_commande_vente >= :date_debut', {
  //       date_debut,
  //     });
  //   } else if (date_fin) {
  //     query.andWhere('commande.date_commande_vente <= :date_fin', { date_fin });
  //   }

  //   // Récupérer les factures avec les relations nécessaires
  //   const invoices = await query
  //     .leftJoinAndSelect('commande.client', 'client')
  //     .select([
  //       'commande.id_commande_vente',
  //       'commande.numero_facture_certifiee',
  //       'commande.date_commande_vente',
  //       'commande.montant_total',
  //       'commande.montant_paye',
  //       'commande.montant_restant',
  //       'commande.reglee',
  //       'client.nom',
  //       'client.prenom',
  //     ])
  //     .orderBy('commande.date_commande_vente', 'DESC')
  //     .getMany();

  //   return invoices;
  // }

  async getUnpaidInvoices(dto: GetUnpaidInvoicesDto) {
    const { id_client, date_debut, date_fin } = dto;

    // Construire la requête
    const query = this.commandeVenteRepository
      .createQueryBuilder('commande')
      .where('commande.reglee = :reglee', { reglee: 0 }); // Factures non réglées

    // Ajouter le filtre par id_client si fourni
    if (id_client) {
      query.andWhere('commande.id_client = :id_client', { id_client });
    }

    // Ajouter le filtre par dates si fourni
    if (date_debut && date_fin) {
      query.andWhere(
        'commande.date_commande_vente BETWEEN :date_debut AND :date_fin',
        {
          date_debut,
          date_fin,
        },
      );
    } else if (date_debut) {
      query.andWhere('commande.date_commande_vente >= :date_debut', {
        date_debut,
      });
    } else if (date_fin) {
      query.andWhere('commande.date_commande_vente <= :date_fin', { date_fin });
    }

    // Récupérer les factures avec les relations nécessaires
    const invoices = await query
      .leftJoinAndSelect('commande.client', 'client')
      .select([
        'commande.id_commande_vente',
        'commande.numero_facture_certifiee',
        'commande.date_commande_vente',
        'commande.montant_total',
        'commande.montant_paye',
        'commande.montant_restant',
        'client.nom',
        'client.prenom',
      ])
      .orderBy('commande.date_commande_vente', 'DESC')
      .getMany();

    return invoices;
  }

  async exportUnpaidInvoicesToExcel(
    dto: GetUnpaidInvoicesDto,
    res: Response,
  ): Promise<void> {
    console.log('exportUnpaidInvoicesToExcel called with:', dto);

    // Valider les entrées
    if (!dto.id_client) {
      console.error('ID client manquant:', dto);
      throw new BadRequestException("L'ID du client est requis");
    }

    try {
      // Récupérer les factures impayées
      const invoices = await this.getUnpaidInvoices(dto);
      console.log('Factures impayées récupérées:', invoices);

      if (!invoices || invoices.length === 0) {
        console.warn(
          'Aucune facture impayée trouvée pour id_client:',
          dto.id_client,
        );
        throw new NotFoundException('Aucune facture impayée trouvée');
      }

      // Créer un nouveau classeur Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Factures Impayées', {
        properties: { tabColor: { argb: 'FFFFC107' } }, // Couleur d'onglet jaune
      });

      // Définir les colonnes
      worksheet.columns = [
        { header: 'ID Facture', key: 'id_commande_vente', width: 15 },
        {
          header: 'Numéro Facture',
          key: 'numero_facture_certifiee',
          width: 20,
        },
        { header: 'Date', key: 'date_commande_vente', width: 20 },
        { header: 'Client', key: 'client_nom', width: 30 },
        { header: 'Montant Total (FCFA)', key: 'montant_total', width: 20 },
        { header: 'Montant Payé (FCFA)', key: 'montant_paye', width: 20 },
        { header: 'Montant Restant (FCFA)', key: 'montant_restant', width: 20 },
      ];

      // Ajouter un titre
      worksheet.mergeCells('A1:G1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `Factures Impayées - Client ID ${dto.id_client}`;
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0F7FA' },
      };

      // Ajouter les en-têtes de colonnes
      worksheet.getRow(2).values = [
        'ID Facture',
        'Numéro Facture',
        'Date',
        'Client',
        'Montant Total (FCFA)',
        'Montant Payé (FCFA)',
        'Montant Restant (FCFA)',
      ];

      // Styliser les en-têtes
      worksheet.getRow(2).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1976D2' }, // Bleu foncé
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Ajouter les données
      invoices.forEach((invoice) => {
        worksheet.addRow({
          id_commande_vente: invoice.id_commande_vente,
          numero_facture_certifiee: invoice.numero_facture_certifiee,
          date_commande_vente: new Date(
            invoice.date_commande_vente,
          ).toLocaleDateString('fr-FR'),
          client_nom:
            `${invoice.client?.nom || 'Inconnu'} ${invoice.client?.prenom || ''}`.trim(),
          montant_total: Number(invoice.montant_total || 0).toFixed(2),
          montant_paye: Number(invoice.montant_paye || 0).toFixed(2),
          montant_restant: Number(invoice.montant_restant || 0).toFixed(2),
        });
      });

      // Styliser les lignes de données
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          // Ignorer le titre et les en-têtes
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          });
        }
      });

      // Ajouter une ligne de total
      const totalRow = worksheet.addRow({
        id_commande_vente: '',
        numero_facture_certifiee: '',
        date_commande_vente: '',
        client_nom: 'Total',
        montant_total: invoices
          .reduce((sum, inv) => sum + Number(inv.montant_total || 0), 0)
          .toFixed(2),
        montant_paye: invoices
          .reduce((sum, inv) => sum + Number(inv.montant_paye || 0), 0)
          .toFixed(2),
        montant_restant: invoices
          .reduce((sum, inv) => sum + Number(inv.montant_restant || 0), 0)
          .toFixed(2),
      });
      totalRow.font = { bold: true };
      totalRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });

      // Définir les en-têtes HTTP
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=factures_impayees_client_${dto.id_client}_${new Date().toISOString().split('T')[0]}.xlsx`,
      );

      // Écrire le fichier Excel dans la réponse
      await workbook.xlsx.write(res);
      res.end();

      console.log('Exportation Excel terminée pour client ID:', dto.id_client);
    } catch (error) {
      console.error("Erreur lors de l'exportation Excel:", error);
      throw new InternalServerErrorException(
        `Erreur lors de l'exportation des factures impayées: ${error.message}`,
      );
    }
  }

  async getTotalPaidAmount(dto: {
    date_debut?: string;
    date_fin?: string;
  }): Promise<number> {
    const query = this.commandeVenteRepository
      .createQueryBuilder('commande')
      .select('SUM(commande.montant_total)', 'total')
      .where('commande.reglee = :reglee', { reglee: 1 });

    if (dto.date_debut && dto.date_fin) {
      query.andWhere(
        'commande.date_commande_vente BETWEEN :date_debut AND :date_fin',
        {
          date_debut: dto.date_debut,
          date_fin: dto.date_fin,
        },
      );
    }

    const result = await query.getRawOne();
    return parseFloat(result?.total || 0);
  }

  async getTotalUnpaidAmount(dto: {
    date_debut?: string;
    date_fin?: string;
  }): Promise<number> {
    const query = this.commandeVenteRepository
      .createQueryBuilder('commande')
      .select('SUM(commande.montant_total)', 'total')
      .where('commande.reglee = :reglee', { reglee: 0 });

    if (dto.date_debut && dto.date_fin) {
      query.andWhere(
        'commande.date_commande_vente BETWEEN :date_debut AND :date_fin',
        {
          date_debut: dto.date_debut,
          date_fin: dto.date_fin,
        },
      );
    }

    const result = await query.getRawOne();
    return parseFloat(result?.total || 0);
  }

  async getFacturesByMonth(dto: {
    date_debut?: string;
    date_fin?: string;
  }): Promise<{
    reglees: { mois: string; count: number }[];
    nonReglees: { mois: string; count: number }[];
  }> {
    const queryReglees = this.commandeVenteRepository
      .createQueryBuilder('commande')
      .select("DATE_FORMAT(commande.date_commande_vente, '%Y-%m')", 'mois')
      .addSelect('COUNT(*)', 'count')
      .where('commande.reglee = :reglee', { reglee: 1 })
      .groupBy('mois')
      .orderBy('mois', 'ASC');

    const queryNonReglees = this.commandeVenteRepository
      .createQueryBuilder('commande')
      .select("DATE_FORMAT(commande.date_commande_vente, '%Y-%m')", 'mois')
      .addSelect('COUNT(*)', 'count')
      .where('commande.reglee = :reglee', { reglee: 0 })
      .groupBy('mois')
      .orderBy('mois', 'ASC');

    if (dto.date_debut && dto.date_fin) {
      queryReglees.andWhere(
        'commande.date_commande_vente BETWEEN :date_debut AND :date_fin',
        {
          date_debut: dto.date_debut,
          date_fin: dto.date_fin,
        },
      );
      queryNonReglees.andWhere(
        'commande.date_commande_vente BETWEEN :date_debut AND :date_fin',
        {
          date_debut: dto.date_debut,
          date_fin: dto.date_fin,
        },
      );
    }

    const reglees = await queryReglees.getRawMany();
    const nonReglees = await queryNonReglees.getRawMany();

    return {
      reglees: reglees.map((r) => ({ mois: r.mois, count: parseInt(r.count) })),
      nonReglees: nonReglees.map((r) => ({
        mois: r.mois,
        count: parseInt(r.count),
      })),
    };
  }

  async getSalesTrend(dto: {
    date_debut?: string;
    date_fin?: string;
  }): Promise<{ month: string; value: number }[]> {
    const query = this.commandeVenteRepository
      .createQueryBuilder('commande')
      .select("DATE_FORMAT(commande.date_commande_vente, '%Y-%m')", 'month')
      .addSelect('SUM(commande.montant_total)', 'value')
      .groupBy('month')
      .orderBy('month', 'ASC');

    if (dto.date_debut && dto.date_fin) {
      query.where(
        'commande.date_commande_vente BETWEEN :date_debut AND :date_fin',
        {
          date_debut: dto.date_debut,
          date_fin: dto.date_fin,
        },
      );
    }

    const result = await query.getRawMany();
    return result.map((r) => ({
      month: r.month,
      value: parseFloat(r.value),
    }));
  }

  async generateUnpaidInvoicesPdf(
    dto: GetUnpaidInvoicesDto,
    res: Response,
  ): Promise<void> {
    try {
      // Récupérer les factures impayées
      const invoices = await this.getUnpaidInvoices(dto);

      if (!invoices || invoices.length === 0) {
        throw new NotFoundException('Aucune facture impayée trouvée');
      }

      // Créer le document PDF
      const doc = new PDFDocument({ size: 'A4', margin: this.MARGINS });
      res.setHeader('Content-Type', 'application/pdf');

      const filename = `releve_factures_impayees_${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      // Sauvegarde locale pour débogage
      doc.pipe(fs.createWriteStream(`test_releve_impaye.pdf`));
      doc.pipe(res);

      // En-tête du document
      this.drawUnpaidInvoicesHeader(doc, dto);

      // Tableau des factures impayées
      this.drawUnpaidInvoicesTable(doc, invoices);

      // Pied de page avec totaux
      this.drawUnpaidInvoicesFooter(doc, invoices);

      // Finaliser le document
      doc.end();
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          message: `Erreur lors de la génération du PDF: ${error.message}`,
        });
      }
      throw new BadRequestException(
        `Erreur lors de la génération du PDF: ${error.message}`,
      );
    }
  }

  private drawUnpaidInvoicesHeader(
    doc: PDFDocument,
    dto: GetUnpaidInvoicesDto,
  ): void {
    // Logo et informations de l'entreprise (partie gauche)
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('VOTRE ENTREPRISE', this.MARGINS, this.MARGINS)
      .fontSize(10)
      .font('Helvetica')
      .text('Adresse de votre entreprise', this.MARGINS, this.MARGINS + 25)
      .text('Téléphone : +227 XX XX XX XX', this.MARGINS, this.MARGINS + 40)
      .text('Email : contact@entreprise.com', this.MARGINS, this.MARGINS + 55);

    // Titre du document (centré)
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('RELEVÉ DES FACTURES IMPAYÉES', 0, this.MARGINS + 80, {
        align: 'center',
        width: doc.page.width,
      });

    // Informations de filtre (partie droite)
    let yPosition = this.MARGINS + 120;
    doc.fontSize(10).font('Helvetica');

    if (dto.id_client) {
      doc.text(`Client ID : ${dto.id_client}`, doc.page.width - 200, yPosition);
      yPosition += 15;
    }

    if (dto.date_debut || dto.date_fin) {
      const dateDebut = dto.date_debut
        ? new Date(dto.date_debut).toLocaleDateString('fr-FR')
        : '-';
      const dateFin = dto.date_fin
        ? new Date(dto.date_fin).toLocaleDateString('fr-FR')
        : '-';
      doc.text(
        `Période : ${dateDebut} au ${dateFin}`,
        doc.page.width - 200,
        yPosition,
      );
      yPosition += 15;
    }

    doc.text(
      `Date d'édition : ${new Date().toLocaleDateString('fr-FR')}`,
      doc.page.width - 200,
      yPosition,
    );
  }

  private drawUnpaidInvoicesTable(doc: PDFDocument, invoices: any[]): void {
    const startY = this.MARGINS + 180;
    let currentY = startY;

    // En-têtes du tableau
    const headers = [
      'Date',
      'N° Facture',
      'Client',
      'Montant Total',
      'Montant Payé',
      'Montant Restant',
    ];
    const columnWidths = [80, 90, 120, 80, 80, 80];
    const startX = this.MARGINS;

    // Dessiner les en-têtes
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');

    let currentX = startX;
    headers.forEach((header, index) => {
      doc
        .rect(currentX, currentY, columnWidths[index], 25)
        .fillAndStroke('#f0f0f0', '#000000')
        .fillColor('#000000')
        .text(header, currentX + 5, currentY + 8, {
          width: columnWidths[index] - 10,
          align: 'center',
        });
      currentX += columnWidths[index];
    });

    currentY += 25;

    // Dessiner les lignes de données
    doc.font('Helvetica').fontSize(9);

    invoices.forEach((invoice, index) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = this.MARGINS;
      }

      const rowData = [
        new Date(invoice.date_commande_vente).toLocaleDateString('fr-FR'),
        invoice.numero_facture_certifiee || 'N/A',
        `${invoice.client?.prenom || ''} ${invoice.client?.nom || ''}`.trim(),
        `${invoice.montant_total?.toLocaleString('fr-FR')} FCFA`,
        `${invoice.montant_paye?.toLocaleString('fr-FR')} FCFA`,
        `${invoice.montant_restant?.toLocaleString('fr-FR')} FCFA`,
      ];

      currentX = startX;

      // Couleur de fond alternée pour les lignes
      const fillColor = index % 2 === 0 ? '#ffffff' : '#f8f8f8';

      rowData.forEach((data, colIndex) => {
        doc
          .rect(currentX, currentY, columnWidths[colIndex], 20)
          .fillAndStroke(fillColor, '#cccccc')
          .fillColor('#000000')
          .text(data, currentX + 3, currentY + 5, {
            width: columnWidths[colIndex] - 6,
            align: colIndex >= 3 ? 'right' : 'left',
          });
        currentX += columnWidths[colIndex];
      });

      currentY += 20;
    });
  }

  private drawUnpaidInvoicesFooter(doc: PDFDocument, invoices: any[]): void {
    // Calculer les totaux
    const totalMontantTotal = invoices.reduce(
      (sum, invoice) => sum + (invoice.montant_total || 0),
      0,
    );
    const totalMontantPaye = invoices.reduce(
      (sum, invoice) => sum + (invoice.montant_paye || 0),
      0,
    );
    const totalMontantRestant = invoices.reduce(
      (sum, invoice) => sum + (invoice.montant_restant || 0),
      0,
    );

    // Position du pied de page
    const footerY = doc.page.height - 150;

    // Ligne de séparation
    doc
      .moveTo(this.MARGINS, footerY)
      .lineTo(doc.page.width - this.MARGINS, footerY)
      .stroke('#000000');

    // Résumé des totaux
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('RÉSUMÉ', this.MARGINS, footerY + 20);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Nombre de factures impayées : ${invoices.length}`,
        this.MARGINS,
        footerY + 40,
      )
      .text(
        `Montant total des factures : ${totalMontantTotal.toLocaleString('fr-FR')} FCFA`,
        this.MARGINS,
        footerY + 55,
      )
      .text(
        `Montant total payé : ${totalMontantPaye.toLocaleString('fr-FR')} FCFA`,
        this.MARGINS,
        footerY + 70,
      )
      .font('Helvetica-Bold')
      .text(
        `Montant total restant dû : ${totalMontantRestant.toLocaleString('fr-FR')} FCFA`,
        this.MARGINS,
        footerY + 85,
      );

    // Note de bas de page
    doc
      .fontSize(8)
      .font('Helvetica-Oblique')
      .text(
        'Ce relevé a été généré automatiquement par le système de gestion.',
        0,
        doc.page.height - 30,
        {
          align: 'center',
          width: doc.page.width,
        },
      );
  }
}
