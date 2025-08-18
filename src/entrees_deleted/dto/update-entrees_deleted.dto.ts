import { PartialType } from '@nestjs/mapped-types';
import { CreateEntreesDeletedDto } from './create-entrees_deleted.dto';

export class UpdateEntreesDeletedDto extends PartialType(CreateEntreesDeletedDto) {}
