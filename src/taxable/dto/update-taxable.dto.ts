import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxableDto } from './create-taxable.dto';

export class UpdateTaxableDto extends PartialType(CreateTaxableDto) {}
