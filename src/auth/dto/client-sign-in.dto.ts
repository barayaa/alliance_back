import { IsString, IsOptional } from 'class-validator';

export class SignInClientDto {
  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  login?: string;

  @IsString()
  password: string;
}
