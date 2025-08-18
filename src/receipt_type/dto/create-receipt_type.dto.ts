import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateReceiptTypeDto {
  @IsString({})
  receipt_type: string;

}
