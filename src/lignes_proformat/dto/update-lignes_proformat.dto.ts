import { PartialType } from '@nestjs/mapped-types';
import { CreateLignesProformatDto } from './create-lignes_proformat.dto';

export class UpdateLignesProformatDto extends PartialType(CreateLignesProformatDto) {}
