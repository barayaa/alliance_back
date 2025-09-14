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
    type: 'full' | 'simple' = 'full',
  ): Promise<void> {
    try {
      // Récupérer la commande
      const commande = await this.commandeVenteRepository.findOne({
        where: { id_commande_vente: id },
        relations: ['client', 'lignes', 'lignes.produit'],
      });
      if (!commande) {
        throw new NotFoundException(`Commande avec id ${id} non trouvée`);
      }

      console.log('Commande récupérée:', JSON.stringify(commande, null, 2));

      // Créer un nouveau document PDF
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      const filename = `facture_${sanitizeString(commande.id_commande_vente.toString())}_${type}.pdf`;
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      // Gérer les erreurs du flux
      doc.on('error', (err) => {
        console.error('Erreur dans le flux PDF:', err);
        if (!res.headersSent) {
          res
            .status(500)
            .json({ message: 'Erreur lors de la génération du PDF' });
        }
      });

      // Sauvegarde locale pour débogage
      const fs = require('fs');
      doc.pipe(fs.createWriteStream(`test_facture_${id}.pdf`));
      console.log(`PDF sauvegardé localement : test_facture_${id}.pdf`);

      // Associer le flux PDF à la réponse
      doc.pipe(res);

      // Ajouter le logo en arrière-plan (filigrane) sur toutes les pages
      // doc.on('pageAdded', () => {
      //   try {
      //     doc
      //       .image('src/uploads/rmlogo.png', 150, 200, {
      //         width: 300,
      //         opacity: 0.1, // Faible opacité pour le filigrane
      //       })
      //       .restore();
      //   } catch (error) {
      //     console.warn('Logo de fond non trouvé, ignoré');
      //   }
      // });

      if (type === 'full') {
        // Fonction pour afficher l'en-tête du tableau
        const drawTableHeader = (
          tableTop: number,
          tableLeft: number,
          columnWidths: number[],
        ) => {
          doc.fontSize(10).font('Helvetica-Bold');
          let x = tableLeft;
          const headers = [
            'Désignation',
            'Quantité',
            'Prix Unitaire',
            "Date d'expiration",
            'Montant',
          ];
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
        };

        // En-tête réorganisé
        const headerTop = 40;
        const headerHeight = 80;
        const pageWidth = 595.28; // Largeur A4
        const margin = 40;
        const sectionWidth = (pageWidth - 2 * margin) / 3; // Trois sections égales

        // Section 1 : Alliance Pharma (gauche)
        doc
          .rect(margin, headerTop, sectionWidth, headerHeight)
          .strokeColor('black')
          .stroke();
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('ALLIANCE PHARMA', margin + 10, headerTop + 10, {
          width: sectionWidth - 20,
          align: 'center',
        });
        doc.fontSize(8).font('Helvetica');
        doc.text('Tel: 80130610', margin + 10, headerTop + 25, {
          width: sectionWidth - 20,
          align: 'center',
        });
        doc.text(
          'RCCM: NE/NIM/01/2024/B14/00004',
          margin + 10,
          headerTop + 35,
          {
            width: sectionWidth - 20,
            align: 'center',
          },
        );
        doc.text('NIF: 37364/R', margin + 10, headerTop + 45, {
          width: sectionWidth - 20,
          align: 'center',
        });
        doc.text('BP: 11807', margin + 10, headerTop + 55, {
          width: sectionWidth - 20,
          align: 'center',
        });
        doc.text('Adresse: NIAMEY', margin + 10, headerTop + 65, {
          width: sectionWidth - 20,
          align: 'center',
        });

        // Section 2 : Logo (milieu)
        doc
          .rect(margin + sectionWidth, headerTop, sectionWidth, headerHeight)
          .strokeColor('black')
          .stroke();
        try {
          doc.image(
            'src/uploads/rmlogo.png',
            margin + sectionWidth + (sectionWidth - 90) / 2,
            headerTop + 10,
            {
              width: 90,
            },
          );
        } catch (error) {
          console.warn('Logo non trouvé, placeholder utilisé');
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('LOGO', margin + sectionWidth + 10, headerTop + 40, {
              width: sectionWidth - 20,
              align: 'center',
            });
        }

        // Section 3 : Numéro facture et date (droite)
        doc
          .rect(
            margin + 2 * sectionWidth,
            headerTop,
            sectionWidth,
            headerHeight,
          )
          .strokeColor('black')
          .stroke();
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(
          `FACTURE DE VENTE N° ${sanitizeString(commande.id_commande_vente.toString())}`,
          margin + 2 * sectionWidth + 10,
          headerTop + 10,
          { width: sectionWidth - 20, align: 'center' },
        );
        doc.fontSize(8).font('Helvetica');
        doc.text(
          `Date: ${formatDate(commande.date_commande_vente)}`,
          margin + 2 * sectionWidth + 10,
          headerTop + 30,
          { width: sectionWidth - 20, align: 'center' },
        );

        // Traits verticaux pour séparer les sections
        doc
          .moveTo(margin + sectionWidth, headerTop)
          .lineTo(margin + sectionWidth, headerTop + headerHeight)
          .stroke();
        doc
          .moveTo(margin + 2 * sectionWidth, headerTop)
          .lineTo(margin + 2 * sectionWidth, headerTop + headerHeight)
          .stroke();

        // Ligne de séparation sous l'en-tête
        doc
          .moveTo(margin, headerTop + headerHeight + 10)
          .lineTo(pageWidth - margin, headerTop + headerHeight + 10)
          .stroke();

        // Infos utilisateur connecté et client (côte à côte)
        const infoTop = headerTop + headerHeight + 20;
        doc.fontSize(8).font('Helvetica');
        doc.text(`Login: ${sanitizeString(commande.login)}`, margin, infoTop);

        // Infos client (à droite)
        const clientX = margin + 400;
        doc.text(
          `Client: ${sanitizeString(commande.client?.nom)}`,
          clientX,
          infoTop,
        );
        doc.text(
          `NIF: ${sanitizeString(commande.client?.nif)}`,
          clientX,
          infoTop + 15,
        );
        doc.text(
          `Adresse: ${sanitizeString(commande.client?.adresse)}`,
          clientX,
          infoTop + 30,
        );
        doc.text(
          `Téléphone: ${sanitizeString(commande.client?.telephone)}`,
          clientX,
          infoTop + 45,
        );

        // Tableau des produits
        const tableTop = infoTop + 60;
        const tableLeft = margin;
        const columnWidths = [200, 80, 80, 100, 80];
        const rowHeight = 20;
        const maxY = 750; // Hauteur maximale de la page (A4 - marges)

        // En-tête du tableau
        drawTableHeader(tableTop, tableLeft, columnWidths);

        // Lignes du tableau
        doc.font('Helvetica');
        let y = tableTop + 30;
        let subtotal = 0;

        commande.lignes.forEach((ligne) => {
          // Vérifier si on dépasse la page
          if (y + rowHeight > maxY) {
            doc.addPage();
            y = 40; // Nouvelle page, marge haute
            drawTableHeader(y, tableLeft, columnWidths);
            y += 30;
          }

          const totalLigne = ligne.montant;
          subtotal += totalLigne;
          let x = tableLeft;
          doc.text(
            sanitizeString(
              ligne.produit?.produit || ligne.designation.toString(),
            ),
            x,
            y,
            { width: columnWidths[0], align: 'left' },
          );
          doc.text(ligne.quantite.toString(), x + columnWidths[0], y, {
            width: columnWidths[1],
            align: 'center',
          });
          doc.text(
            Number(ligne.prix_vente || 0).toFixed(2),
            x + columnWidths[0] + columnWidths[1],
            y,
            { width: columnWidths[2], align: 'center' },
          );
          doc.text(
            formatDate(ligne.produit?.validite_amm),
            x + columnWidths[0] + columnWidths[1] + columnWidths[2],
            y,
            { width: columnWidths[3], align: 'center' },
          );
          doc.text(
            Number(totalLigne || 0).toFixed(2),
            x +
              columnWidths[0] +
              columnWidths[1] +
              columnWidths[2] +
              columnWidths[3],
            y,
            { width: columnWidths[4], align: 'center' },
          );
          y += rowHeight;
        });
        doc
          .moveTo(tableLeft, y)
          .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y)
          .stroke();

        // Vérifier si le résumé dépasse la page
        let summaryTop = y + 20;
        if (summaryTop + 150 > maxY) {
          doc.addPage();
          summaryTop = 40;
        }

        // Résumé
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Résumé', margin, summaryTop);
        doc.fontSize(8).font('Helvetica');
        doc.text(
          `Total TVA: ${Number(commande.tva || 0).toFixed(2)} CFA`,
          margin + 300,
          summaryTop + 10,
          { align: 'right' },
        );
        const precompte = Number(commande.isb || 539);
        doc.text(
          `Précompte BIC [A] 2%: ${precompte.toFixed(2)} CFA`,
          margin + 300,
          summaryTop + 25,
          { align: 'right' },
        );
        doc.text(
          `Total TTC: ${Number(commande.montant_total || 0).toFixed(2)} CFA`,
          margin + 300,
          summaryTop + 40,
          { align: 'right' },
        );
        doc.text(
          `Moyen de paiement: ${sanitizeString(this.typeReglementMapping[commande.type_reglement] || commande.type_reglement)}`,
          margin + 300,
          summaryTop + 55,
          { align: 'right' },
        );
        doc.text(
          `Nombre d'articles: ${commande.lignes.length}`,
          margin + 300,
          summaryTop + 70,
          { align: 'right' },
        );
        doc.text('* Montants en francs CFA', margin + 300, summaryTop + 85, {
          align: 'right',
        });
        doc.text(
          `Arrêté la présente facture à ${numberToWordsFr(Number(commande.montant_total || 0))} francs CFA`,
          margin,
          summaryTop + 100,
        );
        doc.text('Le Gestionnaire', margin, summaryTop + 115, {
          underline: true,
        });

        doc
          .moveTo(margin, summaryTop + 130)
          .lineTo(pageWidth - margin, summaryTop + 130)
          .stroke();
      } else {
        // PDF Simplifié
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(
          `FACTURE DE VENTE N° ${sanitizeString(commande.id_commande_vente.toString())}`,
          50,
          50,
        );
        doc.fontSize(8).font('Helvetica');
        doc.text(`Date: ${formatDate(commande.date_commande_vente)}`, 50, 65);
        doc.text(`Client: ${sanitizeString(commande.client?.nom)}`, 50, 80);

        doc.fontSize(8);
        const tableTop = 110;
        const tableLeft = 50;
        const rowHeight = 20;
        const maxY = 750;

        doc.font('Helvetica-Bold');
        doc.text('Désignation', tableLeft, tableTop, { width: 200 });
        doc.text('Quantité', tableLeft + 200, tableTop, {
          width: 100,
          align: 'right',
        });
        doc.text('Montant', tableLeft + 300, tableTop, {
          width: 100,
          align: 'right',
        });
        doc
          .moveTo(tableLeft, tableTop + 15)
          .lineTo(450, tableTop + 15)
          .stroke();

        let y = tableTop + rowHeight;
        let subtotal = 0;

        doc.font('Helvetica');
        commande.lignes.forEach((ligne) => {
          if (y + rowHeight > maxY) {
            doc.addPage();
            y = 40;
            doc.fontSize(8).font('Helvetica-Bold');
            doc.text('Désignation', tableLeft, y, { width: 200 });
            doc.text('Quantité', tableLeft + 200, y, {
              width: 100,
              align: 'right',
            });
            doc.text('Montant', tableLeft + 300, y, {
              width: 100,
              align: 'right',
            });
            doc
              .moveTo(tableLeft, y + 15)
              .lineTo(450, y + 15)
              .stroke();
            y += rowHeight;
          }

          const totalLigne = ligne.montant;
          subtotal += totalLigne;
          doc.fontSize(8).font('Helvetica');
          doc.text(
            sanitizeString(
              ligne.produit?.produit || ligne.designation.toString(),
            ),
            tableLeft,
            y,
            { width: 200 },
          );
          doc.text(ligne.quantite.toString(), tableLeft + 200, y, {
            width: 100,
            align: 'right',
          });
          doc.text(Number(totalLigne || 0).toFixed(2), tableLeft + 300, y, {
            width: 100,
            align: 'right',
          });
          y += rowHeight;
        });

        doc.moveTo(tableLeft, y).lineTo(450, y).stroke();

        let totalTop = y + 20;
        if (totalTop + 20 > maxY) {
          doc.addPage();
          totalTop = 40;
        }

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(
          `TOTAL TTC: ${Number(commande.montant_total || 0).toFixed(2)} CFA`,
          450,
          totalTop,
          { align: 'right' },
        );
      }

      // Finaliser le document
      console.log('Finalisation du PDF pour commande', id);
      doc.end();

      // Mettre à jour la commande
      commande.imprimee = 1;
      await this.commandeVenteRepository.save(commande);
    } catch (error) {
      console.error(
        'Erreur lors de la génération du PDF:',
        JSON.stringify(error, null, 2),
      );
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
  // async generatePdf(
  //   id: number,
  //   res: Response,
  //   type: 'full' | 'simple' = 'full',
  // ): Promise<void> {
  //   try {
  //     // Récupérer la commande
  //     const commande = await this.commandeVenteRepository.findOne({
  //       where: { id_commande_vente: id },
  //       relations: ['client', 'lignes', 'lignes.produit'],
  //     });
  //     if (!commande) {
  //       throw new NotFoundException(`Commande avec id ${id} non trouvée`);
  //     }

  //     console.log('Commande récupérée:', JSON.stringify(commande, null, 2));

  //     // Créer un nouveau document PDF
  //     const doc = new PDFDocument({ size: 'A4', margin: 40 });
  //     res.setHeader('Content-Type', 'application/pdf');
  //     const filename = `facture_${sanitizeString(commande.id_commande_vente.toString())}_${type}.pdf`;
  //     res.setHeader(
  //       'Content-Disposition',
  //       `attachment; filename="${filename}"`,
  //     );

  //     // Gérer les erreurs du flux
  //     doc.on('error', (err) => {
  //       console.error('Erreur dans le flux PDF:', err);
  //       if (!res.headersSent) {
  //         res
  //           .status(500)
  //           .json({ message: 'Erreur lors de la génération du PDF' });
  //       }
  //     });

  //     // Sauvegarde locale pour débogage
  //     const fs = require('fs');
  //     doc.pipe(fs.createWriteStream(`test_facture_${id}.pdf`));
  //     console.log(`PDF sauvegardé localement : test_facture_${id}.pdf`);

  //     // Associer le flux PDF à la réponse
  //     doc.pipe(res);

  //     // Ajouter le logo en arrière-plan (filigrane) sur toutes les pages
  //     doc.on('pageAdded', () => {
  //       try {
  //         doc
  //           .image('src/uploads/rmlogo.png', 150, 200, {
  //             width: 300,
  //             opacity: 0.1, // Faible opacité pour le filigrane
  //           })
  //           .restore();
  //       } catch (error) {
  //         console.warn('Logo de fond non trouvé, ignoré');
  //       }
  //     });

  //     if (type === 'full') {
  //       // Fonction pour afficher l'en-tête du tableau
  //       const drawTableHeader = (
  //         tableTop: number,
  //         tableLeft: number,
  //         columnWidths: number[],
  //       ) => {
  //         doc.fontSize(10).font('Helvetica-Bold');
  //         let x = tableLeft;
  //         const headers = [
  //           'Désignation',
  //           'Quantité',
  //           'Prix Unitaire',
  //           "Date d'expiration",
  //           'Montant',
  //         ];
  //         headers.forEach((header, i) => {
  //           doc.text(header, x, tableTop, {
  //             width: columnWidths[i],
  //             align: 'center',
  //           });
  //           x += columnWidths[i];
  //         });
  //         doc
  //           .moveTo(tableLeft, tableTop + 20)
  //           .lineTo(
  //             tableLeft + columnWidths.reduce((a, b) => a + b, 0),
  //             tableTop + 20,
  //           )
  //           .stroke();
  //       };

  //       // En-tête réorganisé
  //       const headerTop = 40;
  //       const headerHeight = 80;
  //       const pageWidth = 595.28; // Largeur A4
  //       const margin = 40;
  //       const sectionWidth = (pageWidth - 2 * margin) / 3; // Trois sections égales

  //       // Section 1 : Alliance Pharma (gauche)
  //       doc
  //         .rect(margin, headerTop, sectionWidth, headerHeight)
  //         .strokeColor('black')
  //         .stroke();
  //       doc.fontSize(10).font('Helvetica-Bold');
  //       doc.text('ALLIANCE PHARMA', margin + 10, headerTop + 10, {
  //         width: sectionWidth - 20,
  //         align: 'center',
  //       });
  //       doc.fontSize(8).font('Helvetica');
  //       doc.text('Tel: 80130610', margin + 10, headerTop + 25, {
  //         width: sectionWidth - 20,
  //         align: 'center',
  //       });
  //       doc.text(
  //         'RCCM: NE/NIM/01/2024/B14/00004',
  //         margin + 10,
  //         headerTop + 35,
  //         {
  //           width: sectionWidth - 20,
  //           align: 'center',
  //         },
  //       );
  //       doc.text('NIF: 37364/R', margin + 10, headerTop + 45, {
  //         width: sectionWidth - 20,
  //         align: 'center',
  //       });
  //       doc.text('BP: 11807', margin + 10, headerTop + 55, {
  //         width: sectionWidth - 20,
  //         align: 'center',
  //       });
  //       doc.text('Adresse: NIAMEY', margin + 10, headerTop + 65, {
  //         width: sectionWidth - 20,
  //         align: 'center',
  //       });

  //       // Section 2 : Logo (milieu)
  //       doc
  //         .rect(margin + sectionWidth, headerTop, sectionWidth, headerHeight)
  //         .strokeColor('black')
  //         .stroke();
  //       try {
  //         doc.image(
  //           'src/uploads/rmlogo.png',
  //           margin + sectionWidth + (sectionWidth - 90) / 2,
  //           headerTop + 10,
  //           {
  //             width: 90,
  //           },
  //         );
  //       } catch (error) {
  //         console.warn('Logo non trouvé, placeholder utilisé');
  //         doc
  //           .fontSize(10)
  //           .font('Helvetica-Bold')
  //           .text('LOGO', margin + sectionWidth + 10, headerTop + 40, {
  //             width: sectionWidth - 20,
  //             align: 'center',
  //           });
  //       }

  //       // Section 3 : Numéro facture et date (droite)
  //       doc
  //         .rect(
  //           margin + 2 * sectionWidth,
  //           headerTop,
  //           sectionWidth,
  //           headerHeight,
  //         )
  //         .strokeColor('black')
  //         .stroke();
  //       doc.fontSize(10).font('Helvetica-Bold');
  //       doc.text(
  //         `FACTURE DE VENTE N° ${sanitizeString(commande.id_commande_vente.toString())}`,
  //         margin + 2 * sectionWidth + 10,
  //         headerTop + 10,
  //         { width: sectionWidth - 20, align: 'center' },
  //       );
  //       doc.fontSize(8).font('Helvetica');
  //       doc.text(
  //         `Date: ${formatDate(commande.date_commande_vente)}`,
  //         margin + 2 * sectionWidth + 10,
  //         headerTop + 30,
  //         { width: sectionWidth - 20, align: 'center' },
  //       );

  //       // Traits verticaux pour séparer les sections
  //       doc
  //         .moveTo(margin + sectionWidth, headerTop)
  //         .lineTo(margin + sectionWidth, headerTop + headerHeight)
  //         .stroke();
  //       doc
  //         .moveTo(margin + 2 * sectionWidth, headerTop)
  //         .lineTo(margin + 2 * sectionWidth, headerTop + headerHeight)
  //         .stroke();

  //       // Ligne de séparation sous l'en-tête
  //       doc
  //         .moveTo(margin, headerTop + headerHeight + 10)
  //         .lineTo(pageWidth - margin, headerTop + headerHeight + 10)
  //         .stroke();

  //       // Infos utilisateur connecté et client (côte à côte)
  //       const infoTop = headerTop + headerHeight + 20;
  //       doc.fontSize(8).font('Helvetica');
  //       doc.text(`Login: ${sanitizeString(commande.login)}`, margin, infoTop);

  //       // Infos client (à droite)
  //       const clientX = margin + 300;
  //       doc.text(
  //         `Client: ${sanitizeString(commande.client?.nom)}`,
  //         clientX,
  //         infoTop,
  //       );
  //       doc.text(
  //         `NIF: ${sanitizeString(commande.client?.nif)}`,
  //         clientX,
  //         infoTop + 15,
  //       );
  //       doc.text(
  //         `Adresse: ${sanitizeString(commande.client?.adresse)}`,
  //         clientX,
  //         infoTop + 30,
  //       );
  //       doc.text(
  //         `Téléphone: ${sanitizeString(commande.client?.telephone)}`,
  //         clientX,
  //         infoTop + 45,
  //       );

  //       // Tableau des produits
  //       const tableTop = infoTop + 60;
  //       const tableLeft = margin;
  //       const columnWidths = [200, 80, 80, 100, 80];
  //       const rowHeight = 20;
  //       const maxY = 750; // Hauteur maximale de la page (A4 - marges)

  //       // En-tête du tableau
  //       drawTableHeader(tableTop, tableLeft, columnWidths);

  //       // Lignes du tableau
  //       doc.font('Helvetica');
  //       let y = tableTop + 30;
  //       let subtotal = 0;

  //       commande.lignes.forEach((ligne) => {
  //         // Vérifier si on dépasse la page
  //         if (y + rowHeight > maxY) {
  //           doc.addPage();
  //           y = 40; // Nouvelle page, marge haute
  //           drawTableHeader(y, tableLeft, columnWidths);
  //           y += 30;
  //         }

  //         const totalLigne = ligne.montant;
  //         subtotal += totalLigne;
  //         let x = tableLeft;
  //         doc.text(
  //           sanitizeString(
  //             ligne.produit?.produit || ligne.designation.toString(),
  //           ),
  //           x,
  //           y,
  //           { width: columnWidths[0], align: 'left' },
  //         );
  //         doc.text(ligne.quantite.toString(), x + columnWidths[0], y, {
  //           width: columnWidths[1],
  //           align: 'center',
  //         });
  //         doc.text(
  //           Number(ligne.prix_vente || 0).toFixed(2),
  //           x + columnWidths[0] + columnWidths[1],
  //           y,
  //           { width: columnWidths[2], align: 'center' },
  //         );
  //         doc.text(
  //           formatDate(ligne.produit?.validite_amm),
  //           x + columnWidths[0] + columnWidths[1] + columnWidths[2],
  //           y,
  //           { width: columnWidths[3], align: 'center' },
  //         );
  //         doc.text(
  //           Number(totalLigne || 0).toFixed(2),
  //           x +
  //             columnWidths[0] +
  //             columnWidths[1] +
  //             columnWidths[2] +
  //             columnWidths[3],
  //           y,
  //           { width: columnWidths[4], align: 'center' },
  //         );
  //         y += rowHeight;
  //       });
  //       doc
  //         .moveTo(tableLeft, y)
  //         .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), y)
  //         .stroke();

  //       // Vérifier si le résumé dépasse la page
  //       let summaryTop = y + 20;
  //       if (summaryTop + 150 > maxY) {
  //         doc.addPage();
  //         summaryTop = 40;
  //       }

  //       // Résumé
  //       doc.fontSize(10).font('Helvetica-Bold');
  //       doc.text('Résumé', margin, summaryTop);
  //       doc.fontSize(8).font('Helvetica');
  //       doc.text(
  //         `Total TVA: ${Number(commande.tva || 0).toFixed(2)} CFA`,
  //         margin + 300,
  //         summaryTop + 10,
  //         { align: 'right' },
  //       );
  //       const precompte = Number(commande.isb || 539);
  //       doc.text(
  //         `Précompte BIC [A] 2%: ${precompte.toFixed(2)} CFA`,
  //         margin + 300,
  //         summaryTop + 25,
  //         { align: 'right' },
  //       );
  //       doc.text(
  //         `Total TTC: ${Number(commande.montant_total || 0).toFixed(2)} CFA`,
  //         margin + 300,
  //         summaryTop + 40,
  //         { align: 'right' },
  //       );
  //       doc.text(
  //         `Moyen de paiement: ${sanitizeString(this.typeReglementMapping[commande.type_reglement] || commande.type_reglement)}`,
  //         margin + 300,
  //         summaryTop + 55,
  //         { align: 'right' },
  //       );
  //       doc.text(
  //         `Nombre d'articles: ${commande.lignes.length}`,
  //         margin + 300,
  //         summaryTop + 70,
  //         { align: 'right' },
  //       );
  //       doc.text('* Montants en francs CFA', margin + 300, summaryTop + 85, {
  //         align: 'right',
  //       });
  //       doc.text(
  //         `Arrêté la présente facture à ${numberToWordsFr(Number(commande.montant_total || 0))} francs CFA`,
  //         margin,
  //         summaryTop + 100,
  //       );
  //       doc.text('Le Gestionnaire', margin, summaryTop + 115, {
  //         underline: true,
  //       });

  //       doc
  //         .moveTo(margin, summaryTop + 130)
  //         .lineTo(pageWidth - margin, summaryTop + 130)
  //         .stroke();
  //     } else {
  //       // PDF Simplifié
  //       doc.fontSize(10).font('Helvetica-Bold');
  //       doc.text(
  //         `FACTURE DE VENTE N° ${sanitizeString(commande.id_commande_vente.toString())}`,
  //         50,
  //         50,
  //       );
  //       doc.fontSize(8).font('Helvetica');
  //       doc.text(`Date: ${formatDate(commande.date_commande_vente)}`, 50, 65);
  //       doc.text(`Client: ${sanitizeString(commande.client?.nom)}`, 50, 80);

  //       doc.fontSize(8);
  //       const tableTop = 110;
  //       const tableLeft = 50;
  //       const rowHeight = 20;
  //       const maxY = 750;

  //       doc.font('Helvetica-Bold');
  //       doc.text('Désignation', tableLeft, tableTop, { width: 200 });
  //       doc.text('Quantité', tableLeft + 200, tableTop, {
  //         width: 100,
  //         align: 'right',
  //       });
  //       doc.text('Montant', tableLeft + 300, tableTop, {
  //         width: 100,
  //         align: 'right',
  //       });
  //       doc
  //         .moveTo(tableLeft, tableTop + 15)
  //         .lineTo(450, tableTop + 15)
  //         .stroke();

  //       let y = tableTop + rowHeight;
  //       let subtotal = 0;

  //       doc.font('Helvetica');
  //       commande.lignes.forEach((ligne) => {
  //         if (y + rowHeight > maxY) {
  //           doc.addPage();
  //           y = 40;
  //           doc.fontSize(8).font('Helvetica-Bold');
  //           doc.text('Désignation', tableLeft, y, { width: 200 });
  //           doc.text('Quantité', tableLeft + 200, y, {
  //             width: 100,
  //             align: 'right',
  //           });
  //           doc.text('Montant', tableLeft + 300, y, {
  //             width: 100,
  //             align: 'right',
  //           });
  //           doc
  //             .moveTo(tableLeft, y + 15)
  //             .lineTo(450, y + 15)
  //             .stroke();
  //           y += rowHeight;
  //         }

  //         const totalLigne = ligne.montant;
  //         subtotal += totalLigne;
  //         doc.fontSize(8).font('Helvetica');
  //         doc.text(
  //           sanitizeString(
  //             ligne.produit?.produit || ligne.designation.toString(),
  //           ),
  //           tableLeft,
  //           y,
  //           { width: 200 },
  //         );
  //         doc.text(ligne.quantite.toString(), tableLeft + 200, y, {
  //           width: 100,
  //           align: 'right',
  //         });
  //         doc.text(Number(totalLigne || 0).toFixed(2), tableLeft + 300, y, {
  //           width: 100,
  //           align: 'right',
  //         });
  //         y += rowHeight;
  //       });

  //       doc.moveTo(tableLeft, y).lineTo(450, y).stroke();

  //       let totalTop = y + 20;
  //       if (totalTop + 20 > maxY) {
  //         doc.addPage();
  //         totalTop = 40;
  //       }

  //       doc.fontSize(10).font('Helvetica-Bold');
  //       doc.text(
  //         `TOTAL TTC: ${Number(commande.montant_total || 0).toFixed(2)} CFA`,
  //         450,
  //         totalTop,
  //         { align: 'right' },
  //       );
  //     }

  //     // Finaliser le document
  //     console.log('Finalisation du PDF pour commande', id);
  //     doc.end();

  //     // Mettre à jour la commande
  //     commande.imprimee = 1;
  //     await this.commandeVenteRepository.save(commande);
  //   } catch (error) {
  //     console.error(
  //       'Erreur lors de la génération du PDF:',
  //       JSON.stringify(error, null, 2),
  //     );
  //     if (!res.headersSent) {
  //       res.status(500).json({
  //         message: `Erreur lors de la génération du PDF: ${error.message}`,
  //       });
  //     }
  //     throw new BadRequestException(
  //       `Erreur lors de la génération du PDF: ${error.message}`,
  //     );
  //   }
  // }

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

    const where: any = { type_facture: 'FV' };
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
    // console.log('Payload reçu:', JSON.stringify(dto, null, 2));
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

        // Valider type_isb
        const isbs = await manager.find(Isb, { select: ['isb'] });
        // console.log('Données brutes de isb:', JSON.stringify(isbs, null, 2));
        const validIsb = isbs.map((isb) => isb.isb.trim().toUpperCase());
        // console.log('Valeurs valides de type_isb (pourcentages):', validIsb);
        const isbMapping: { [key: string]: string } = {
          A: '0%',
          C: '2%',
          D: '5%',
        };
        const mappedTypeIsb =
          isbMapping[dto.type_isb.toUpperCase()] || dto.type_isb.toUpperCase();
        // if (!validIsb.includes(mappedTypeIsb)) {
        //   throw new BadRequestException(
        //     `Type ISB invalide: ${dto.type_isb}. Valeurs valides: ${validIsb.join(', ')} (mappé à: ${mappedTypeIsb})`,
        //   );
        // }
        const isbRecord = await manager.findOne(Isb, {
          where: { isb: mappedTypeIsb },
        });
        const isbRate: any = isbRecord?.taux || 0;
        console.log('Taux ISB pour', mappedTypeIsb, ':', isbRate);

        // Valider type_reglement
        const typeReglements = await manager.find(TypeReglement);
        const validTypeReglements = typeReglements.map((tr) =>
          tr.type_reglement.trim().toUpperCase(),
        );
        const receivedTypeReglement =
          this.typeReglementMapping[dto.type_reglement] ||
          dto.type_reglement.toUpperCase();
        // if (!validTypeReglements.includes(receivedTypeReglement)) {
        //   throw new BadRequestException(
        //     `Type de règlement invalide: ${dto.type_reglement}. Valeurs valides: ${validTypeReglements.join(', ')}`,
        //   );
        // }

        if (dto.remise == null || isNaN(dto.remise) || dto.remise < 0) {
          throw new BadRequestException(
            `Remise invalide: ${dto.remise}. Doit être un nombre positif en CFA`,
          );
        }

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

        const existingCommande = await manager.findOne(CommandeVente, {
          where: { numero_facture_certifiee },
        });
        if (existingCommande) {
          throw new BadRequestException(
            `Une commande existe déjà avec le numéro de facture ${numero_facture_certifiee}`,
          );
        }

        const commande = manager.create(CommandeVente, {
          date_commande_vente: new Date(dto.date_commande_vente),
          montant_total: 0,
          montant_paye: 0,
          montant_restant: 0,
          remise: dto.remise,
          validee: 1,
          statut: 0,
          id_client: dto.id_client,
          client,
          reglee: 0,
          moyen_reglement: 0,
          type_reglement: 'E',
          tva: 0,
          type_isb: dto.type_isb,
          isb: 0,
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
          `Commande sauvegardée avec id_commande_vente: ${savedCommande.id_commande_vente}`,
        );

        // Créer les lignes
        let subtotal = 0;
        let montant_tva = 0;
        let isb_total = 0;
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
          const remise = ligne.remise ?? 0;
          const montant_ligne = prix_vente * ligne.quantite * (1 - remise);
          const taux_tva = ligne.taux_tva ?? produit.taux_tva ?? 0;
          const montant_tva_ligne = montant_ligne * (taux_tva / 100);
          const isb_ligne = ligne.isb_ligne ?? montant_ligne * isbRate;
          subtotal += montant_ligne;
          montant_tva += montant_tva_ligne;
          isb_total += isb_ligne;

          const ligneDto: CreateLignesCommandeVenteDto = {
            id_produit: ligne.id_produit,
            prix_vente,
            remise,
            description_remise: ligne.description_remise || 'Aucune',
            prix_vente_avant_remise:
              ligne.prix_vente_avant_remise ?? prix_vente.toString(),
            quantite: ligne.quantite,
            group_tva: ligne.group_tva ?? produit.group_tva ?? '',
            etiquette_tva: ligne.etiquette_tva ?? produit.etiquette_tva ?? '',
            taux_tva,
            isb_ligne,
            date: ligne.date ?? dto.date_commande_vente,
          };
          console.log(
            `Création de ligne pour commande ${savedCommande.id_commande_vente}`,
          );
          const savedLigne = await this.lignesCommandeVenteService.create(
            ligneDto,
            savedCommande.id_commande_vente,
            dto.login,
          );
          savedLignes.push(savedLigne);
        }

        // Mettre à jour les montants
        const montant_total = subtotal + montant_tva + isb_total - dto.remise;
        await manager.update(
          CommandeVente,
          { id_commande_vente: savedCommande.id_commande_vente },
          {
            montant_total,
            montant_restant: montant_total,
            tva: montant_tva,
            isb: isb_total,
          },
        );

        savedCommande.lignes = savedLignes;
        return savedCommande;
      } catch (error) {
        console.error(
          'Erreur dans la transaction:',
          JSON.stringify(error, null, 2),
        );
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
            statut: 2, // Statut annulé
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
      .innerJoin('client', 'c', 'cv.id_client = c.id_client')
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
      .andWhere('p.produit != :timbre', { timbre: 'Timbre fiscale' }) // Exclure Timbre fiscale
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
        worksheet.addRow([]);
        worksheet.addRow(['Total', '', '', commande.total]);
        worksheet.addRow(['Montant réglé', '', '', commande.montant_regle]);
        worksheet.addRow(['Montant restant', '', '', commande.montant_restant]);
        if (index < clientData.commandes.length - 1) {
          worksheet.addRow([]);
        }
      });
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
    //  console.log('Excel buffer size:', buffer.length);
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
  async getUnpaidInvoices(dto: GetUnpaidInvoicesDto) {
    const { id_client, date_debut, date_fin } = dto;

    if (!id_client) {
      throw new BadRequestException("L'ID du client est requis");
    }

    // Construire la requête
    const query = this.commandeVenteRepository
      .createQueryBuilder('commande')
      .where('commande.id_client = :id_client', { id_client })
      .andWhere('commande.reglee = :reglee', { reglee: 0 }); // Factures non réglées

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
        'commande.reglee',
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
}
