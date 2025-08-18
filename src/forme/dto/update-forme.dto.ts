import { PartialType } from '@nestjs/mapped-types';
import { CreateFormeDto } from './create-forme.dto';

export class UpdateFormeDto extends PartialType(CreateFormeDto) {}
