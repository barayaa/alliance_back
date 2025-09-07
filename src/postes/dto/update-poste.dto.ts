import { PartialType } from '@nestjs/mapped-types';
import { CreatePosteDto } from './create-poste.dto';

export class UpdatePosteDto extends PartialType(CreatePosteDto) {}
