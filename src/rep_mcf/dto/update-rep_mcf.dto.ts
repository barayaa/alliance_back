import { PartialType } from '@nestjs/mapped-types';
import { CreateRepMcfDto } from './create-rep_mcf.dto';

export class UpdateRepMcfDto extends PartialType(CreateRepMcfDto) {}
