import { PartialType } from '@nestjs/mapped-types';
import { CreateFabricantDto } from './create-fabricant.dto';

export class UpdateFabricantDto extends PartialType(CreateFabricantDto) {}
