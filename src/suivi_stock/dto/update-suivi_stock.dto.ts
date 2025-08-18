import { PartialType } from '@nestjs/mapped-types';
import { CreateSuiviStockDto } from './create-suivi_stock.dto';

export class UpdateSuiviStockDto extends PartialType(CreateSuiviStockDto) {}
