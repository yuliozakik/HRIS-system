import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { AuthenticatedUser } from '../../common/types/auth-user';
import { RoleName } from '../../common/enums/role.enum';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  private toAuthUser(account: {
    id: string;
    email: string;
    employeeId: string | null;
    role: { name: string };
  }): AuthenticatedUser {
    return {
      userId: account.id,
      email: account.email,
      role: account.role.name as RoleName,
      employeeId: account.employeeId,
    };
  }

  private signTokens(user: AuthenticatedUser): TokenPair {
    const accessToken = this.jwt.sign(user, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
    const refreshToken = this.jwt.sign(user, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
    return { accessToken, refreshToken };
  }

  async login(email: string, password: string, ipAddress?: string) {
    const account = await this.prisma.userAccount.findUnique({
      where: { email },
      include: { role: true, employee: true },
    });

    if (!account || !account.isActive) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const passwordValid = await bcrypt.compare(password, account.passwordHash);
    if (!passwordValid) {
      await this.prisma.auditLog.create({
        data: { userId: account.id, action: 'LOGIN_FAILED', ipAddress },
      });
      throw new UnauthorizedException('Email atau password salah');
    }

    const authUser = this.toAuthUser(account);
    const tokens = this.signTokens(authUser);

    await this.prisma.auditLog.create({
      data: { userId: account.id, action: 'LOGIN_SUCCESS', ipAddress },
    });

    return {
      ...tokens,
      user: {
        id: account.id,
        email: account.email,
        role: authUser.role,
        employeeId: account.employeeId,
        fullName: account.employee?.fullName ?? account.email,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: AuthenticatedUser;
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid');
    }

    const account = await this.prisma.userAccount.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });
    if (!account || !account.isActive) {
      throw new UnauthorizedException('Sesi tidak valid');
    }

    const authUser = this.toAuthUser(account);
    return this.signTokens(authUser);
  }

  async me(userId: string) {
    const account = await this.prisma.userAccount.findUnique({
      where: { id: userId },
      include: { role: true, employee: true },
    });
    if (!account) {
      throw new UnauthorizedException();
    }
    return {
      id: account.id,
      email: account.email,
      role: account.role.name,
      employeeId: account.employeeId,
      fullName: account.employee?.fullName ?? account.email,
    };
  }

  async forgotPassword(email: string) {
    const account = await this.prisma.userAccount.findUnique({ where: { email } });
    // Always respond success regardless of whether the email exists, to avoid account enumeration.
    if (!account) {
      return { message: 'Jika email terdaftar, instruksi reset password telah dikirim' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        userId: account.id,
        tokenHash,
        expiresAt: dayjs().add(1, 'hour').toDate(),
      },
    });

    const resetUrl = `${this.config.get<string>('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token=${rawToken}`;
    await this.mail.send({
      to: account.email,
      subject: 'Reset Password HRIS',
      text: `Klik tautan berikut untuk reset password Anda (berlaku 1 jam): ${resetUrl}`,
    });

    return { message: 'Jika email terdaftar, instruksi reset password telah dikirim' };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!resetToken) {
      throw new UnauthorizedException('Token reset password tidak valid atau kadaluarsa');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.userAccount.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password berhasil direset' };
  }
}
