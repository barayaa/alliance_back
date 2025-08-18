import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateInvoicesDeletedDto {
  @IsNumber({})
  id_invoices_deleted: number;

  @IsString({})
  date: string;

  @IsString({})
  user: string;

}
