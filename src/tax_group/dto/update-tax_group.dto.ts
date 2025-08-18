import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxGroupDto } from './create-tax_group.dto';

export class UpdateTaxGroupDto extends PartialType(CreateTaxGroupDto) {}
