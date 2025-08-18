import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoicesDeletedDto } from './create-invoices_deleted.dto';

export class UpdateInvoicesDeletedDto extends PartialType(CreateInvoicesDeletedDto) {}
