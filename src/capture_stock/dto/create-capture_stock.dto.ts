import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';
import { Produit } from 'src/produit/produit.entity';
import { ManyToOne } from 'typeorm';

export class CreateCaptureStockDto {
  @IsNumber({})
  id_produit: number;

  @IsNumber({})
  stock_courant: number;

  @IsDate({})
  date_capture: Date;

  @ManyToOne(() => Produit, (produit) => produit.id_produit)
  produit: Produit;
}
