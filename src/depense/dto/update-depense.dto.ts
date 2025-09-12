import { PartialType } from '@nestjs/mapped-types';
import { CreateDepenseDto } from './create-depense.dto';

export class UpdateDepenseDto extends PartialType(CreateDepenseDto) {}
