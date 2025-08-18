import { PartialType } from '@nestjs/mapped-types';
import { CreateReceiptTypeDto } from './create-receipt_type.dto';

export class UpdateReceiptTypeDto extends PartialType(CreateReceiptTypeDto) {}
