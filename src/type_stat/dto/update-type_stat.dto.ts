import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeStatDto } from './create-type_stat.dto';

export class UpdateTypeStatDto extends PartialType(CreateTypeStatDto) {}
