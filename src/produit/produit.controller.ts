import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Res,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ProduitService } from './produit.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { Produit } from './produit.entity';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { CorrectStockDto } from './dto/correct-produit.dto';
import * as XLSX from 'xlsx';
@Controller('produit')
export class ProduitController {
  constructor(private readonly produitService: ProduitService) {}

  // @Get('export_inventaire')
  // async exportProducts(
  //   @Query('search') searchTerm: string,
  //   @Res() res: Response,
  // ) {
  //   try {
  //     // Récupérer les produits depuis le service
  //     const produits = await this.produitService.exportAllProducts(searchTerm);

  //     // Créer une nouvelle feuille de calcul
  //     const worksheet = XLSX.utils.json_to_sheet(produits);
  //     const workbook = XLSX.utils.book_new();
  //     XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');

  //     // Générer le buffer du fichier Excel
  //     const excelBuffer = XLSX.write(workbook, {
  //       bookType: 'xlsx',
  //       type: 'buffer',
  //     });

  //     // Configurer les en-têtes de la réponse
  //     res.set({
  //       'Content-Type':
  //         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //       'Content-Disposition': 'attachment; filename="produits.xlsx"',
  //     });

  //     // Envoyer le buffer au client
  //     res.send(excelBuffer);
  //   } catch (error) {
  //     throw new HttpException(
  //       "Erreur lors de l'exportation des produits en Excel",
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  @Get('export_inventaire')
  async exportProducts(
    @Query('search') searchTerm: string,
    @Res() res: Response,
  ) {
    try {
      // Récupérer les produits depuis le service
      const produits = await this.produitService.exportAllProducts(searchTerm);

      // Calculer la somme totale des valeurs de la colonne 'total'
      const sommeTotale = produits.reduce((sum, p) => sum + p.total, 0);

      // Créer les données pour la feuille Excel, incluant la ligne de somme
      const dataForExcel = [
        ...produits,
        { produit: '', prix_unitaire: '', stock_courant: '', total: '' }, // Ligne vide
        {
          produit: 'Somme totale',
          prix_unitaire: '',
          stock_courant: '',
          total: sommeTotale,
        },
      ];

      // Créer une nouvelle feuille de calcul
      const worksheet = XLSX.utils.json_to_sheet(dataForExcel, {
        header: ['produit', 'prix_unitaire', 'stock_courant', 'total'],
      });

      // Appliquer un format à la cellule de la somme totale (par exemple, en gras)
      const totalRowIndex = produits.length + 2; // +1 pour l'en-tête, +1 pour la ligne vide
      worksheet[`D${totalRowIndex + 1}`] = {
        v: sommeTotale,
        t: 'n', // Type numérique
        s: {
          font: { bold: true }, // Mettre en gras
          alignment: { horizontal: 'right' },
        },
      };

      // Ajuster la largeur des colonnes
      worksheet['!cols'] = [
        { wch: 30 }, // produit
        { wch: 15 }, // prix_unitaire
        { wch: 15 }, // stock_courant
        { wch: 15 }, // total
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');

      // Générer le buffer du fichier Excel
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'buffer',
      });

      // Configurer les en-têtes de la réponse
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="produits.xlsx"',
      });

      // Envoyer le buffer au client
      res.send(excelBuffer);
    } catch (error) {
      throw new HttpException(
        "Erreur lors de l'exportation des produits en Excel",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post(':id/correct-stock')
  async correctStock(@Param('id') id: number, @Body() dto: CorrectStockDto) {
    return this.produitService.correctStockWithAudit(id, dto);
  }

  @Get('stock-value')
  async getStockValue(
    @Query() dto: { date_debut?: string; date_fin?: string },
  ): Promise<number> {
    try {
      return await this.produitService.getStockValue(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('stock-by-product')
  async getStockByProduct(
    @Query() dto: { date_debut?: string; date_fin?: string },
  ): Promise<{ produit: string; quantite: number }[]> {
    try {
      return await this.produitService.getStockByProduct(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('perimes')
  getProduitsPerimes(): Promise<Produit[]> {
    return this.produitService.getProduitsPerimes();
  }

  @Get('expirant-dans-six-mois')
  async getProduitsExpirantDansSixMois(): Promise<Produit[]> {
    return this.produitService.getProduitsExpirantDansSixMois();
  }

  // @Get('stock-movements')
  // async getStockMovements(@Query('date') date: string) {
  //   return this.produitService.getStockMovements(date);
  // }
  @Get()
  async findAll(@Query('search') searchTerm: string) {
    return this.produitService.findAll(searchTerm);
  }

  @Get('export-excel')
  async exportExcel(@Query('search') searchTerm: string, @Res() res: Response) {
    console.log('exportExcel appelé avec searchTerm:', searchTerm);
    const produits = await this.produitService.findAllForExport(searchTerm);

    // Log pour vérifier si ACFOL est inclus
    const acfol = produits.find((p) => p.id_produit === 409);
    console.log('Produit ACFOL dans exportExcel:', acfol || 'Non trouvé');
    console.log('Nombre total de produits:', produits.length);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Produits', {
      properties: { tabColor: { argb: 'FF4CAF50' } },
    });

    // Définir les colonnes
    worksheet.columns = [
      { header: 'Nom du produit', key: 'produit', width: 30 },
      { header: 'Dosage', key: 'dosage', width: 15 },
      { header: 'Forme du produit', key: 'forme', width: 20 },
      { header: 'Marque', key: 'marque', width: 20 },
      { header: 'Stock courant', key: 'stock_courant', width: 20 },
      {
        header: 'Classe thérapeutique',
        key: 'classe_therapeutique',
        width: 20,
      },
      { header: 'Fournisseur', key: 'titulaire_amm', width: 25 },
    ];

    // Ajouter les données avec log pour chaque produit
    try {
      produits.forEach((produit, index) => {
        console.log(`Ajout de la ligne ${index + 1}:`, produit.produit);
        worksheet.addRow({
          produit: produit.produit || '',
          dosage: produit.dosage || '',
          forme: produit.forme?.forme || '',
          marque: produit.marque?.marque || '',
          stock_courant: produit.stock_courant ?? 0,
          classe_therapeutique:
            produit.classe_therapeutique?.classe_therapeutique || '',
          titulaire_amm: produit.titulaire_amm?.titulaire_amm || '',
        });
      });
    } catch (error) {
      console.error('Erreur lors de l’ajout des lignes au worksheet:', error);
      throw new BadRequestException(
        'Erreur lors de la génération du fichier Excel.',
      );
    }

    // Style de l'en-tête (deuxième ligne)
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

    // Style des lignes de données
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

    // Titre principal
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'Liste des Produits';
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

    // En-têtes des colonnes
    worksheet.getRow(2).values = [
      'Nom du produit',
      'Dosage',
      'Forme du produit',
      'Marque',
      'Stock courant',
      'Classe thérapeutique',
      'Fournisseur',
    ];

    // Formater la colonne Stock courant comme nombre entier
    worksheet.getColumn('stock_courant').numFmt = '0';

    // Définir les en-têtes HTTP
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=produits.xlsx');

    // Écrire le fichier avec gestion des erreurs
    try {
      await workbook.xlsx.write(res);
      console.log('Fichier Excel généré avec succès');
    } catch (error) {
      console.error('Erreur lors de l’écriture du fichier Excel:', error);
      throw new BadRequestException(
        'Erreur lors de l’écriture du fichier Excel.',
      );
    }

    res.end();
  }

  // @Get('export-excel')
  // async exportExcel(@Query('search') searchTerm: string, @Res() res: Response) {
  //   const produits = await this.produitService.findAllForExport(searchTerm);

  //   const workbook = new ExcelJS.Workbook();
  //   const worksheet = workbook.addWorksheet('Produits', {
  //     properties: { tabColor: { argb: 'FF4CAF50' } },
  //   });

  //   // Définir les colonnes
  //   worksheet.columns = [
  //     { header: 'Nom du produit', key: 'produit', width: 30 },
  //     { header: 'Dosage', key: 'dosage', width: 15 },
  //     { header: 'Forme du produit', key: 'forme', width: 20 },
  //     { header: 'Marque', key: 'marque', width: 20 },
  //     { header: 'Stock courant', key: 'stock_courant', width: 20 },
  //     {
  //       header: 'Classe thérapeutique',
  //       key: 'classe_therapeutique',
  //       width: 20,
  //     },
  //     { header: 'Fournisseur', key: 'titulaire_amm', width: 25 },
  //   ];

  //   // Ajouter les données
  //   produits.forEach((produit) => {
  //     worksheet.addRow({
  //       produit: produit.produit || '',
  //       dosage: produit.dosage || '',
  //       forme: produit.forme?.forme || '',
  //       marque: produit.marque?.marque || '',
  //       stock_courant: produit.stock_courant ?? 0,
  //       classe_therapeutique:
  //         produit.classe_therapeutique?.classe_therapeutique || '',
  //       titulaire_amm: produit.titulaire_amm?.titulaire_amm || '',
  //     });
  //   });

  //   // Style de l'en-tête (deuxième ligne)
  //   worksheet.getRow(2).eachCell((cell) => {
  //     cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  //     cell.fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FF1976D2' },
  //     };
  //     cell.alignment = { vertical: 'middle', horizontal: 'center' };
  //     cell.border = {
  //       top: { style: 'thin' },
  //       left: { style: 'thin' },
  //       bottom: { style: 'thin' },
  //       right: { style: 'thin' },
  //     };
  //   });

  //   // Style des lignes de données
  //   worksheet.eachRow((row, rowNumber) => {
  //     if (rowNumber > 2) {
  //       row.eachCell((cell) => {
  //         cell.border = {
  //           top: { style: 'thin' },
  //           left: { style: 'thin' },
  //           bottom: { style: 'thin' },
  //           right: { style: 'thin' },
  //         };
  //         cell.alignment = { vertical: 'middle', horizontal: 'left' };
  //       });
  //     }
  //   });

  //   // Titre principal
  //   worksheet.mergeCells('A1:G1');
  //   worksheet.getCell('A1').value = 'Liste des Produits';
  //   worksheet.getCell('A1').font = { size: 16, bold: true };
  //   worksheet.getCell('A1').alignment = {
  //     vertical: 'middle',
  //     horizontal: 'center',
  //   };
  //   worksheet.getCell('A1').fill = {
  //     type: 'pattern',
  //     pattern: 'solid',
  //     fgColor: { argb: 'FFE0F7FA' },
  //   };

  //   // En-têtes des colonnes
  //   worksheet.getRow(2).values = [
  //     'Nom du produit',
  //     'Dosage',
  //     'Forme du produit',
  //     'Marque',
  //     'Stock courant',
  //     'Classe thérapeutique',
  //     'Fournisseur',
  //   ];

  //   // Formater la colonne Stock courant comme nombre entier
  //   worksheet.getColumn('stock_courant').numFmt = '0';

  //   // Définir les en-têtes HTTP
  //   res.setHeader(
  //     'Content-Type',
  //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //   );
  //   res.setHeader('Content-Disposition', 'attachment; filename=produits.xlsx');

  //   // Écrire et envoyer le fichier
  //   await workbook.xlsx.write(res);
  //   res.end();
  // }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Produit> {
    return this.produitService.findOne(+id);
  }

  @Post()
  async create(@Body() createDto: CreateProduitDto): Promise<Produit> {
    return this.produitService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProduitDto,
  ): Promise<Produit> {
    return this.produitService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.produitService.remove(+id);
  }
}
