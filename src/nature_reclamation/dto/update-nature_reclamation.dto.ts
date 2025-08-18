import { PartialType } from '@nestjs/mapped-types';
import { CreateNatureReclamationDto } from './create-nature_reclamation.dto';

export class UpdateNatureReclamationDto extends PartialType(CreateNatureReclamationDto) {}
