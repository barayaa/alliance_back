import { PartialType } from '@nestjs/mapped-types';
import { CreateIsbDto } from './create-isb.dto';

export class UpdateIsbDto extends PartialType(CreateIsbDto) {}
