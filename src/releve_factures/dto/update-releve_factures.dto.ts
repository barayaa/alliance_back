import { PartialType } from '@nestjs/mapped-types';
import { CreateReleveFacturesDto } from './create-releve_factures.dto';

export class UpdateReleveFacturesDto extends PartialType(CreateReleveFacturesDto) {}
