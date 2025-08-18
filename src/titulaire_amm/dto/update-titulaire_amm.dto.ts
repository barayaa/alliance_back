import { PartialType } from '@nestjs/mapped-types';
import { CreateTitulaireAmmDto } from './create-titulaire_amm.dto';

export class UpdateTitulaireAmmDto extends PartialType(CreateTitulaireAmmDto) {}
