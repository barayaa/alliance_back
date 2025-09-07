import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from './hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignupDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Client } from 'src/client/client.entity';
import { SignInClientDto } from './dto/client-sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private hasshingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConffigutation: ConfigType<typeof jwtConfig>,

    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async signUp(signUpDto: SignupDto) {
    try {
      const user = new User();
      user.nom = signUpDto.nom;
      user.prenom = signUpDto.prenom;
      user.email = signUpDto.email;
      user.telephone = signUpDto.telephone;
      user.login = signUpDto.login;
      user.password_status = signUpDto.password_status;
      user.profil = 0;
      // user.id_fonction = signUpDto.id_fonction;
      // user.id_departement = signUpDto.id_departement;
      // user.id_service = signUpDto.id_service;
      user.id_direction = signUpDto.id_direction;
      user.poste = signUpDto.poste;
      user.password = await this.hasshingService.hash(signUpDto.password);
      user.role = signUpDto.role;
      await this.userRepository.save(user);
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (err) {
      const pgUniqueViolationErrorCode = '23505';
      if (err.code === pgUniqueViolationErrorCode) {
        throw new ConflictException();
      }
      throw err;
    }
  }

  async signIn(signInDto: SignInDto) {
    // const user = await this.userRepository.findOneBy({
    //   email: signInDto.email,
    // });

    if (!signInDto.email && !signInDto.login) {
      throw new BadRequestException(
        'Vous devez fournir soit un email, soit un login',
      );
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email OR user.login = :login', {
        email: signInDto.email || null,
        login: signInDto.login || null,
      })
      .getOneOrFail()
      .catch(() => {
        throw new UnauthorizedException("L'utilisateur n'existe pas");
      });

    if (!user) {
      throw new UnauthorizedException("l'utilisateur n'existe pas");
    }

    const isEqual = await this.hasshingService.compare(
      signInDto.password,
      user.password,
    );

    if (!isEqual) {
      throw new UnauthorizedException('mot de passe incorrect');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        id: user.id_user,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        poste: user.poste,
        role: user.role,
        type: 'user',
      },
      {
        audience: this.jwtConffigutation.audience,
        issuer: this.jwtConffigutation.issuer,
        secret: this.jwtConffigutation.secret,
        expiresIn: this.jwtConffigutation.accessTokenTtl,
      },
    );

    return {
      accessToken,
    };
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: {
        id_user: changePasswordDto.userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException("L'utilisateur n'existe pas");
    }

    const isCurrentPasswordValid = await this.hasshingService.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    user.password = await this.hasshingService.hash(
      changePasswordDto.newPassword,
    );
    await this.userRepository.save(user);
    return { message: 'Mot de passe modifié avec succès' };
  }

  async signInClient(signInClientDto: SignInClientDto) {
    // Vérifier que l'email ou le login est fourni
    if (!signInClientDto.email && !signInClientDto.login) {
      throw new BadRequestException(
        'Vous devez fournir soit un email, soit un login',
      );
    }

    // Rechercher le client par email ou login
    const client = await this.clientRepository
      .createQueryBuilder('client')
      .where('client.email = :email OR client.login = :login', {
        email: signInClientDto.email || null,
        login: signInClientDto.login || null,
      })
      .getOneOrFail()
      .catch(() => {
        throw new UnauthorizedException("Le client n'existe pas");
      });

    if (!client) {
      throw new UnauthorizedException("Le client n'existe pas");
    }

    // Vérifier le mot de passe
    const isEqual = await this.hasshingService.compare(
      signInClientDto.password,
      client.password,
    );

    if (!isEqual) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    // Générer le token JWT avec les infos du client
    const accessToken = await this.jwtService.signAsync(
      {
        id: client.id_client,
        email: client.email,
        nom: client.nom,
        prenom: client.prenom,
        nif: client.nif,
        avance: client.avance,
        solde: client.solde,
        type: 'client',
      },
      {
        audience: this.jwtConffigutation.audience,
        issuer: this.jwtConffigutation.issuer,
        secret: this.jwtConffigutation.secret,
        expiresIn: this.jwtConffigutation.accessTokenTtl,
      },
    );

    return {
      accessToken,
    };
  }
}
