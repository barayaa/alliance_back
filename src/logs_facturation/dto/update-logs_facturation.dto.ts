import { PartialType } from '@nestjs/mapped-types';
import { CreateLogsFacturationDto } from './create-logs_facturation.dto';

export class UpdateLogsFacturationDto extends PartialType(CreateLogsFacturationDto) {}
