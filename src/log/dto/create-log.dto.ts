import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateLogDto {
  @IsString({})
  log: string;

  @IsDate({})
  date: Date;

  @IsString({})
  user: string;

  @IsNumber({})
  archive: number;

}
