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
} from '@nestjs/common';
import { ProduitService } from './produit.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { Produit } from './produit.entity';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
@Controller('produit')
export class ProduitController {
  constructor(private readonly produitService: ProduitService) {}

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
    const produits = await this.produitService.findAllForExport(searchTerm);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Produits', {
      properties: { tabColor: { argb: 'FF4CAF50' } },
    });

    worksheet.columns = [
      { header: 'Nom du produit', key: 'produit', width: 30 },
      { header: 'Dosage', key: 'dosage', width: 15 },
      { header: 'Forme du produit', key: 'forme', width: 20 },
      { header: 'Marque', key: 'marque', width: 20 },
      {
        header: 'Classe thérapeutique',
        key: 'classe_therapeutique',
        width: 20,
      },
      { header: 'Fournisseur', key: 'titulaire_amm', width: 25 },
    ];

    produits.forEach((produit) => {
      worksheet.addRow({
        produit: produit.produit || '',
        dosage: produit.dosage || '',
        forme: produit.forme?.forme || '',
        marque: produit.marque?.marque || '',
        classe_therapeutique:
          produit.classe_therapeutique?.classe_therapeutique || '',
        titulaire_amm: produit.titulaire_amm?.titulaire_amm || '',
      });
    });

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

    worksheet.mergeCells('A1:F1');
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

    worksheet.getRow(2).values = [
      'Nom du produit',
      'Dosage',
      'Forme du produit',
      'Marque',
      'Classe thérapeutique',
      'Fournisseur',
    ];

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=produits.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }

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
