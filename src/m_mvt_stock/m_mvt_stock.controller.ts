import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  StreamableFile,
  Request,
} from '@nestjs/common';
import { MMvtStockService } from './m_mvt_stock.service';
import { CreateMMvtStockDto } from './dto/create-m_mvt_stock.dto';
import { UpdateMMvtStockDto } from './dto/update-m_mvt_stock.dto';
import { MMvtStock } from './m_mvt_stock.entity';
import { Auth } from 'src/auth/decorators/auth.decorators';
import { AuthType } from 'src/auth/enums/auth.types.enum';
import { CreateEntreeStockDto } from './dto/create-entree-stock.dto';
import { User } from '../user/user.entity';

@Controller('m_mvt_stock')
export class MMvtStockController {
  constructor(private readonly mMvtStockService: MMvtStockService) {}

  // @Get('finddTout')
  // async finddTout() {
  //   return this.mMvtStockService.finddTout();
  // }

  // @Get('getAllStockMovements')
  // async getAllStockMovements(@Query('date') date: string) {
  //   return this.mMvtStockService.getAllStockMovements(date);
  // }
  @Get()
  async findAll(
    @Query('searchTerm') searchTerm: string,
    @Query('dateDebut') dateDebut: string,
    @Query('dateFin') dateFin: string,
    @Query('typeMvt') typeMvt: string,
    @Query('produitId') produitId: string,
  ) {
    return this.mMvtStockService.findAll(
      searchTerm || '',
      dateDebut || '',
      dateFin || '',
      typeMvt || '',
      produitId || '',
    );

    // async findAll(
    //   @Query('searchTerm') searchTerm: string,
    //   @Query('dateDebut') dateDebut: string,
    //   @Query('dateFin') dateFin: string,
    //   @Query('typeMvt') typeMvt: string,
    //   @Query('produitId') produitId: string,
    // ) {
    //   return this.mMvtStockService.findAll(
    //     searchTerm,
    //     dateDebut,
    //     dateFin,
    //     typeMvt,
    //     produitId,
    //   );
  }

  @Get('export')
  async exportToExcel(
    @Query('searchTerm') searchTerm: string,
    @Query('dateDebut') dateDebut: string,
    @Query('dateFin') dateFin: string,
    @Query('typeMvt') typeMvt: string,
    @Query('produitId') produitId: string,
  ) {
    console.log('Controller received params:', {
      searchTerm,
      dateDebut,
      dateFin,
      typeMvt,
      produitId,
    });
    const buffer = await this.mMvtStockService.exportToExcel(
      searchTerm,
      dateDebut,
      dateFin,
      typeMvt,
      produitId,
    );
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="mouvements_stock.xlsx"',
    });
  }

  // @Post('add_stock')
  // // @Auth(AuthType.Bearer)
  // async create(
  //   @Body() createDto: CreateEntreeStockDto,
  //   @Request() req: { user: User },
  // ) {
  //   return this.mMvtStockService.create(createDto, req.user);
  // }
}
