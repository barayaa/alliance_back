import { PartialType } from '@nestjs/mapped-types';
import { CreateConformiteDto } from './create-conformite.dto';

export class UpdateConformiteDto extends PartialType(CreateConformiteDto) {}
