import { PartialType } from '@nestjs/mapped-types';
import { CreateNitaDto } from './create-nita.dto';

export class UpdateNitaDto extends PartialType(CreateNitaDto) {}
