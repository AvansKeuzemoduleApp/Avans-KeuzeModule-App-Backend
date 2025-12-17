import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
    imports: [
    UsersModule,

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
    providers: [AuthService],
})
export class AuthModule {}
