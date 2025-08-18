import { PartialType } from '@nestjs/mapped-types';
import { CreateRemiseDto } from './create-remise.dto';

export class UpdateRemiseDto extends PartialType(CreateRemiseDto) {}
