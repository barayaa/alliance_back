import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
  Res,
  ParseIntPipe,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientInvoice, CommandeVenteService } from './commande_vente.service';
import { CreateCommandeVenteDto } from './dto/create-commande_vente.dto';
import { UpdateCommandeVenteDto } from './dto/update-commande_vente.dto';
import { CommandeVente } from './commande_vente.entity';
import { SaleDto } from './dto/sales.dto';
import { IsDateString } from 'class-validator';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { Auth } from 'src/auth/decorators/auth.decorators';
import { AuthType } from 'src/auth/enums/auth.types.enum';
import { GetUnpaidInvoicesDto } from './dto/invoice-unpaid.dto';
import { GetSupplierStatsDto } from './dto/suplierStat.dto';

interface ProductSalesHistory {
  id_facture: number;
  date_facture: Date;
  client_nom: string;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
  commentaire: string | null;
}

class DateRangeDto {
  @IsDateString({}, { message: 'La date_debut doit être au format YYYY-MM-DD' })
  date_debut: string;

  @IsDateString({}, { message: 'La date_fin doit être au format YYYY-MM-DD' })
  date_fin: string;

  limit?: number; // Limite par défaut pour éviter la pagination
}

@Controller('commande_vente')
export class CommandeVenteController {
  constructor(private readonly commandeVenteService: CommandeVenteService) {}

  // @Auth(AuthType.None)
  // @Get('export-unpaid-by-client/:clientId')
  // async exportUnpaidInvoicesByClient(
  //   @Param('clientId') clientId: number,
  //   @Query() dto: GetUnpaidInvoicesDto,
  //   @Res() res: Response,
  // ): Promise<void> {
  //   // Récupérer les factures impayées pour ce client
  //   const invoices = await this.commandeVenteService.getUnpaidInvoices({
  //     ...dto,
  //     id_client: clientId,
  //   });

  //   // Générer le PDF
  //   await this.commandeVenteService.exportUnpaidInvoicesByClient(
  //     res,
  //     clientId,
  //     invoices,
  //   );
  // }

  @Auth(AuthType.None)
  @Post('export-unpaid-by-client')
  async exportUnpaidInvoicesByClientPost(
    @Body() body: { clientId: number; invoices: any[] },
    @Res() res: Response,
  ): Promise<void> {
    const { clientId, invoices } = body;

    if (!invoices || invoices.length === 0) {
      throw new BadRequestException('Aucune facture à exporter');
    }

    await this.commandeVenteService.exportUnpaidInvoicesByClient(
      res,
      clientId,
      invoices,
    );
  }

  @Get('supplier-stats')
  async getSupplierProductStats(@Query() dto: GetSupplierStatsDto) {
    return this.commandeVenteService.getSupplierProductStats(dto);
  }

  @Auth(AuthType.None)
  @Get('supplier-stats/export')
  async exportSupplierStats(
    @Query() dto: GetSupplierStatsDto,
    @Res() res: Response,
  ) {
    return this.commandeVenteService.exportSupplierStatsToExcel(dto, res);
  }

  // Exporter toutes les factures annulées dans un seul PDF
  @Auth(AuthType.None)
  @Get('export/cancelled')
  async exportCancelledInvoices(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('idClient') idClient?: number,
  ) {
    return this.commandeVenteService.exportCancelledInvoices(
      res,
      startDate,
      endDate,
      idClient,
    );
  }

  @Auth(AuthType.None)
  @Get(':id/pdf/cancelled/:type')
  async generateCancelledPdf(
    @Param('id', ParseIntPipe) id: number,
    @Param('type') type: 'full' | 'simple' | 'bl' | 'bp',
    @Res() res: Response,
  ) {
    return this.commandeVenteService.generateCancelledPdf(id, res, type);
  }

  @Auth(AuthType.None)
  @Get('unpaid-invoices/pdf')
  @Get('findtout')
  findTout() {
    return this.commandeVenteService.getA();
  }

  @Get('sales-trend')
  async getSalesTrend(
    @Query() dto: { date_debut?: string; date_fin?: string },
  ) {
    try {
      return await this.commandeVenteService.getSalesTrend(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('paid-amount')
  async getPaidAmount(
    @Query() dto: { date_debut?: string; date_fin?: string },
  ) {
    try {
      return await this.commandeVenteService.getTotalPaidAmount(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('unpaid-amount')
  async getUnpaidAmount(
    @Query() dto: { date_debut?: string; date_fin?: string },
  ) {
    try {
      return await this.commandeVenteService.getTotalUnpaidAmount(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('factures-by-month')
  async getFacturesByMonth(
    @Query() dto: { date_debut?: string; date_fin?: string },
  ) {
    try {
      return await this.commandeVenteService.getFacturesByMonth(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('unpaid-invoices/export')
  async exportUnpaidInvoices(
    @Query() dto: GetUnpaidInvoicesDto,
    @Res() res: Response,
  ) {
    await this.commandeVenteService.exportUnpaidInvoicesToExcel(dto, res);
  }

  @Get('unpaid-facture')
  async getUnpaidFacture(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        skipMissingProperties: true, // Ignore les propriétés manquantes ou undefined
      }),
    )
    dto: GetUnpaidInvoicesDto,
  ) {
    return this.commandeVenteService.getUnpaidInvoices(dto);
  }

  @Get('product-sales-history')
  async getProductSalesHistory(
    @Query('id_produit', ParseIntPipe) id_produit: number,
    @Query('date_debut') date_debut?: string,
    @Query('date_fin') date_fin?: string,
    @Query('id_client') id_client?: string, // Changé en string pour éviter ParseIntPipe
  ): Promise<ProductSalesHistory[]> {
    // Convertir id_client en number si fourni, sinon undefined
    const parsedIdClient = id_client ? parseInt(id_client, 10) : undefined;
    if (id_client && isNaN(parsedIdClient)) {
      throw new BadRequestException('id_client doit être un nombre');
    }
    return this.commandeVenteService.getProductSalesHistory(
      id_produit,
      date_debut,
      date_fin,
      parsedIdClient,
    );
  }

  // @Get('product-sales-history')
  // async getProductSalesHistory(
  //   @Query('id_produit', ParseIntPipe) id_produit: number,
  //   @Query('date_debut') date_debut?: string,
  //   @Query('date_fin') date_fin?: string,
  //   @Query('id_client', ParseIntPipe) id_client?: number,
  // ): Promise<ProductSalesHistory[]> {
  //   return this.commandeVenteService.getProductSalesHistory(
  //     id_produit,
  //     date_debut,
  //     date_fin,
  //     id_client,
  //   );
  // }

  @Post(':id/cancel')
  async cancelCommandeVente(
    @Param('id', ParseIntPipe) id: number,
    @Body('login') login: string,
  ): Promise<void> {
    console.log('Login reçu dans le controller:', login); // *** AJOUTE CETTE LIGNE ***
    return this.commandeVenteService.cancelCommandeVente(id, login);
  }

  @Get()
  async findAll(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('idClient') idClient: string,
    @Query('numeroFacture') numeroFacture: string,
  ) {
    return this.commandeVenteService.findAll(
      startDate,
      endDate,
      idClient ? parseInt(idClient) : undefined,
      numeroFacture,
    );
  }

  @Get('cancel_invoice')
  async findAllCancel(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('idClient') idClient: string,
    @Query('numeroFacture') numeroFacture: string,
  ) {
    return this.commandeVenteService.findAllCancel(
      startDate,
      endDate,
      idClient ? parseInt(idClient) : undefined,
      numeroFacture,
    );
  }

  @Get(':id/pdf')
  @Auth(AuthType.None)
  async generatePdf(
    @Param('id') id: string,
    @Query('type') type: 'full' | 'simple',
    @Res() res: Response,
  ) {
    await this.commandeVenteService.generatePdf(+id, res, type);
  }

  // Nouvelle route pour le résumé global
  @Get('global-sales-summary')
  async getGlobalSalesSummary(
    @Query('year') year: string,
    @Query('clientId') clientId?: string,
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
    console.log('Controller getGlobalSalesSummary called with:', {
      year,
      clientId,
    });
    const parsedClientId = clientId ? parseInt(clientId, 10) : undefined;
    if (clientId && isNaN(parsedClientId)) {
      throw new BadRequestException('Invalid client ID');
    }
    return this.commandeVenteService.getGlobalSalesSummary(
      year,
      parsedClientId,
    );
  }

  // Route existante pour l'export Excel (non modifiée)@Get('global-sales-summary/export-excel')
  async exportGlobalSalesToExcel(
    @Query('year') year: string,
    @Res() res: Response,
  ): Promise<void> {
    console.log('Controller exportGlobalSalesToExcel called with:', { year });
    if (!year || !/^\d{4}$/.test(year)) {
      throw new BadRequestException('Invalid year format. Use YYYY.');
    }
    await this.commandeVenteService.exportGlobalSalesToExcel(year, res);
  }

  // Nouvelle route pour les clients
  @Get('clients')
  async getClients(): Promise<{ id: number; name: string }[]> {
    return this.commandeVenteService.getClients();
  }

  @Get('daily-sales-summary')
  async getDailySalesSummary(@Query('date') date: string): Promise<{
    totalVentes: number;
    totalFactures: number;
    totalRegle: number;
    totalEnAttente: number;
  }> {
    return this.commandeVenteService.getDailySalesSummary(date);
  }

  @Get('invoices')
  async getInvoicesByClient(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    // @Query('clientName') clientName?: string,
  ): Promise<{
    data: ClientInvoice[];
    periode: string;
  }> {
    return this.commandeVenteService.getInvoicesByClient(startDate, endDate);
  }

  @Get('invoices/export-excel')
  async exportInvoicesToExcel(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.commandeVenteService.exportInvoicesToExcel(
        startDate,
        endDate,
      );
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=factures_${startDate}_to_${endDate}.xlsx`,
      });
      res.send(buffer);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      res.status(500).send('Error exporting Excel');
    }
  }

  @Get('report/export-excel')
  async exportSalesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('reportType') reportType: 'ca' | 'quantity',
    @Query('supplierId') supplierId?: number,
    @Res() res?: Response,
  ) {
    console.log('Received params for export:', {
      startDate,
      endDate,
      reportType,
      supplierId,
    });
    const report = await this.commandeVenteService.getSalesReport(
      startDate,
      endDate,
      reportType,
      supplierId,
    );

    const workbook = new ExcelJS.Workbook();

    report.data.forEach((supplierData) => {
      const worksheet = workbook.addWorksheet(
        supplierData.fournisseur || 'Inconnu',
        {
          properties: { tabColor: { argb: 'FF4CAF50' } },
        },
      );

      worksheet.columns = [
        { header: 'Nom du produit', key: 'nom_produit', width: 30 },
        {
          header: 'Dénomination commune internationale',
          key: 'denomination',
          width: 30,
        },
        { header: 'Dosage', key: 'dosage', width: 15 },
        {
          header:
            reportType === 'ca'
              ? "Chiffre d'affaires (FCFA)"
              : 'Quantité vendue',
          key: reportType === 'ca' ? 'chiffre_affaire' : 'quantite_vendue',
          width: 20,
        },
      ];

      supplierData.produits.forEach((produit: any) => {
        worksheet.addRow({
          nom_produit: produit.nom_produit || '',
          denomination: produit.denomination || '',
          dosage: produit.dosage || '',
          [reportType === 'ca' ? 'chiffre_affaire' : 'quantite_vendue']:
            reportType === 'ca'
              ? produit.chiffre_affaire || 0
              : produit.quantite_vendue || 0,
        });
      });

      const total = supplierData.produits.reduce(
        (sum: number, produit: any) =>
          sum +
          (reportType === 'ca'
            ? produit.chiffre_affaire || 0
            : produit.quantite_vendue || 0),
        0,
      );

      worksheet.addRow({});
      worksheet.addRow({
        nom_produit: 'Total',
        [reportType === 'ca' ? 'chiffre_affaire' : 'quantite_vendue']: total,
      });

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, size: 14 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
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

      worksheet.mergeCells('A1:D1');
      worksheet.getCell('A1').value =
        `Rapport des Ventes - ${supplierData.fournisseur || 'Inconnu'} (${reportType === 'ca' ? "Chiffre d'affaires" : 'Quantité vendue'})`;
    });

    const globalTotalRow = workbook.addWorksheet('Résumé', {
      properties: { tabColor: { argb: 'FFFFC107' } },
    });
    globalTotalRow.columns = [
      { header: 'Période', key: 'periode', width: 30 },
      { header: 'Total Global', key: 'total', width: 20 },
    ];
    globalTotalRow.addRow({
      periode: report.periode,
      total: report.total,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=rapport_ventes.xlsx',
    );

    await workbook.xlsx.write(res);
    res.end();
  }
  @Get('report')
  async getSalesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('reportType') reportType: 'ca' | 'quantity',
    @Query('supplierId') supplierId?: number,
  ) {
    return this.commandeVenteService.getSalesReport(
      startDate,
      endDate,
      reportType,
      supplierId,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CommandeVente> {
    return this.commandeVenteService.findOne(+id);
  }

  @Post('facture_vente')
  async create(
    @Body() createDto: CreateCommandeVenteDto,
  ): Promise<CommandeVente> {
    return this.commandeVenteService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCommandeVenteDto,
  ): Promise<CommandeVente> {
    return this.commandeVenteService.update(+id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.commandeVenteService.remove(+id);
  }

  // @Get('sales/all')
  // async getAllSales(): Promise<SaleDto[]> {
  //   return this.commandeVenteService.getAllSales();
  // }

  @Get('sales/all')
  async getAllSales(): Promise<{
    data: SaleDto[];
    total_montant: number;
    count: number;
  }> {
    return this.commandeVenteService.getAllSales();
  }

  @Get('sales/by-date')
  async getSalesByDateRange(@Query() query: DateRangeDto): Promise<{
    data: SaleDto[];
    total_montant: number;
    periode: string;
    count: number;
  }> {
    const { date_debut, date_fin, limit } = query;

    // Vérifier que date_debut <= date_fin
    if (new Date(date_debut) > new Date(date_fin)) {
      throw new BadRequestException(
        'La date de début doit être antérieure ou égale à la date de fin.',
      );
    }

    return this.commandeVenteService.getSalesByDateRange(
      date_debut,
      date_fin,
      limit,
    );
  }
}
