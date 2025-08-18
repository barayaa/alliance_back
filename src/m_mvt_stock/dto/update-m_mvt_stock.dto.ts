import { PartialType } from '@nestjs/mapped-types';
import { CreateMMvtStockDto } from './create-m_mvt_stock.dto';

export class UpdateMMvtStockDto extends PartialType(CreateMMvtStockDto) {}
