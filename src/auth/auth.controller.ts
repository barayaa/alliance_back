import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthType } from './enums/auth.types.enum';
import { SignupDto } from './dto/sign-up.dto';
import { Auth } from './decorators/auth.decorators';
import { SignInDto } from './dto/sign-in.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignInClientDto } from './dto/client-sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Auth(AuthType.None)
  @Post('client/signin')
  async signInClient(@Body() signInClientDto: SignInClientDto) {
    return this.authService.signInClient(signInClientDto);
  }

  @Post('signup')
  @Auth(AuthType.None)
  // @Post('sign-up')
  signup(@Body() signUpDto: SignupDto) {
    return this.authService.signUp(signUpDto);
  }

  @Auth(AuthType.None)
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Res({ passthrough: true }) response: any,
    @Body() signInDto: SignInDto,
  ) {
    return this.authService.signIn(signInDto);
    // const accessToken = await this.authService.signIn(signInDto);
    // response.cookie('accessToken', accessToken, {
    //   secure: true,
    //   httpOnly: true,
    //   sameSite: true,
    // });
  }

  @Auth(AuthType.None)
  @Post('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(changePasswordDto);
  }
}
