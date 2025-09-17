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
import { Poste } from 'src/postes/entities/poste.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private hasshingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConffigutation: ConfigType<typeof jwtConfig>,

    @InjectRepository(Poste) private posteRepository: Repository<Poste>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  // async signUp(signUpDto: SignupDto) {
  //   try {
  //     const user = new User();
  //     user.nom = signUpDto.nom;
  //     user.prenom = signUpDto.prenom;
  //     user.email = signUpDto.email;
  //     user.telephone = signUpDto.telephone;
  //     user.login = signUpDto.login;
  //     // user.password_status = signUpDto.password_status;
  //     user.poste = signUpDto.poste;
  //     user.password = await this.hasshingService.hash(signUpDto.password);
  //     user.role = signUpDto.role;
  //     await this.userRepository.save(user);
  //     const { password, ...userWithoutPassword } = user;
  //     return userWithoutPassword;
  //   } catch (err) {
  //     const pgUniqueViolationErrorCode = '23505';
  //     if (err.code === pgUniqueViolationErrorCode) {
  //       throw new ConflictException();
  //     }
  //     throw err;
  //   }
  // }

  async signUp(signUpDto: SignupDto) {
    try {
      // Valider poste (si fourni, car nullable)
      let poste = null;
      if (signUpDto.poste !== null && signUpDto.poste !== undefined) {
        poste = await this.posteRepository.findOne({
          where: { id: signUpDto.poste },
        });
        if (!poste) {
          throw new BadRequestException(
            `ID de poste invalide : ${signUpDto.poste}. ID valide : [1]`,
          );
        }
      }

      const user = new User();
      user.nom = signUpDto.nom;
      user.prenom = signUpDto.prenom;
      user.email = signUpDto.email;
      user.telephone = signUpDto.telephone;
      user.login = signUpDto.login;
      user.posteEntity = poste; // Assigner l'entité Poste
      user.password = await this.hasshingService.hash(signUpDto.password);
      user.role = signUpDto.role;
      await this.userRepository.save(user);

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('Email ou login déjà utilisé');
      }
      if (err.code === '23503') {
        throw new BadRequestException('ID de poste invalide');
      }
      throw err;
    }
  }

  // async signUp(signUpDto: SignupDto) {
  //   try {
  //     // Validate poste (if provided, since it's nullable)
  //     let poste = null;
  //     if (signUpDto.poste !== null && signUpDto.poste !== undefined) {
  //       poste = await this.posteRepository.findOne({
  //         where: { id: signUpDto.poste },
  //       });
  //       if (!poste) {
  //         throw new BadRequestException(
  //           `Invalid poste ID: ${signUpDto.poste}. Valid IDs: [1]`,
  //         );
  //       }
  //     }

  //     // Validate profil (if provided, assuming it's a foreign key)
  //     // let profil = null;
  //     // if (signUpDto.profil !== null && signUpDto.profil !== undefined) {
  //     //   profil = await this.profilRepository.findOne({
  //     //     where: { id: signUpDto.profil },
  //     //   });
  //     //   if (!profil) {
  //     //     throw new BadRequestException(
  //     //       `Invalid profil ID: ${signUpDto.profil}`,
  //     //     );
  //     //   }
  //     // }

  //     // Validate role (ENUM)
  //     const validRoles = ['regular', 'admin', 'superadmin'];
  //     if (!validRoles.includes(signUpDto.role)) {
  //       throw new BadRequestException(
  //         `Invalid role: ${signUpDto.role}. Must be one of: ${validRoles.join(', ')}`,
  //       );
  //     }

  //     const user = new User();
  //     user.nom = signUpDto.nom;
  //     user.prenom = signUpDto.prenom;
  //     user.email = signUpDto.email;
  //     user.telephone = signUpDto.telephone;
  //     user.login = signUpDto.login;
  //     // user.password_status = signUpDto.password_status; // Uncomment if needed
  //     user.poste = poste; // Nullable, so can be null
  //     // user.profil = profil; // Nullable, so can be null
  //     user.password = await this.hasshingService.hash(signUpDto.password);
  //     user.role = signUpDto.role; // Direct assignment since it's an ENUM
  //     await this.userRepository.save(user);

  //     const { password, ...userWithoutPassword } = user;
  //     return userWithoutPassword;
  //   } catch (err) {
  //     // Handle unique constraint violation (e.g., duplicate email or login)
  //     if (err.code === '23505') {
  //       throw new ConflictException('Email or login already exists');
  //     }
  //     // Handle foreign key constraint violation
  //     if (err.code === '23503') {
  //       throw new BadRequestException('Invalid poste or profil ID provided');
  //     }
  //     throw err; // Rethrow other errors for debugging
  //   }
  // }

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
