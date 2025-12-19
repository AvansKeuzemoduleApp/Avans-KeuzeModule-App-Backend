import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { RefreshToken } from './tokens/refresh-token.entity';
import { RefreshTokensService } from './tokens/refresh-tokens.service';
import { JwtCookieAuthGuard } from './guards/jwt-cookie.guard';

import { LoginProtectionService } from './login-protection/login-protection.service';

@Module({
    imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken]),

    JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => {
            const secret = cfg.get<string>('JWT_SECRET');
            
            const raw = cfg.get<string>('JWT_EXPIRES_IN_SECONDS');
            const expiresInSeconds = Number(raw);

            return{
                secret,
                signOptions: {expiresIn: Number.isFinite(expiresInSeconds) ? expiresInSeconds : 900},
            };
        }
    })
],
    controllers: [AuthController],
    providers: [AuthService, RefreshTokensService, JwtCookieAuthGuard, LoginProtectionService],
    exports: [JwtCookieAuthGuard],
})
export class AuthModule {}
