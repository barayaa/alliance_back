import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { CreateLignesCommandeAchatDto } from './create-lignes_commande_achat.dto';
import { Type } from 'class-transformer';

export class CreateLignesCommandeAchatPayloadDto {
  // @ValidateNested()
  // @Type(() => CreateLignesCommandeAchatDto)
  // ligne: CreateLignesCommandeAchatDto;
  // @IsString()
  // user: string;
  // @IsString()
  // reference: string;
  // @IsNumber()
  // id_destination: number;
}
