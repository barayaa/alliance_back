import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class CreateDestinationDto {
  @IsString({})
  destination: string;

  @IsNumber({})
  pu_prime_transport: number;

}
