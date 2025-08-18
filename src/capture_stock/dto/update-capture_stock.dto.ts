import { PartialType } from '@nestjs/mapped-types';
import { CreateCaptureStockDto } from './create-capture_stock.dto';

export class UpdateCaptureStockDto extends PartialType(CreateCaptureStockDto) {}
