import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {


    userId: number;

    @IsNotEmpty()
    @IsString()
    currentPassword: string;

    @IsNotEmpty()
    @IsString()
    newPassword: string;
}
