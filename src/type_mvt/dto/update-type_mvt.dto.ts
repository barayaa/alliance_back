import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeMvtDto } from './create-type_mvt.dto';

export class UpdateTypeMvtDto extends PartialType(CreateTypeMvtDto) {}
