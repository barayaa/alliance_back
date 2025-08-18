import { PartialType } from '@nestjs/mapped-types';
import { CreateProformatDto } from './create-proformat.dto';

export class UpdateProformatDto extends PartialType(CreateProformatDto) {}
