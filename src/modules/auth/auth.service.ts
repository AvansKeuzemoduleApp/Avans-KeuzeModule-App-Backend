import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokensService } from './tokens/refresh-tokens.service';

@Injectable()
export class AuthService {
    private readonly dummyHash: string;
    
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly refreshTokens: RefreshTokensService,
        private readonly config: ConfigService,
    ) {
        const v = this.config.get<string>('DUMMY_HASH');
        if (!v)
            throw new Error('DUMMY_HASH missing in environment');

        this.dummyHash = v;
    }

    async register(dto: RegisterDto): Promise<void> {
        const email = dto.email.trim().toLowerCase();
        const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
        const passwordHash = await bcrypt.hash(dto.password, rounds);

        await this.usersService.createIfNotExists(email, passwordHash);
    }

    async login (dto: LoginDto): Promise<{accessToken: string; refreshToken: string  }> {
        const user = await this.usersService.findByEmail(dto.email);

        const hashToCheck = user?.passwordHash ?? this.dummyHash;
        const ok = await bcrypt.compare(dto.password, hashToCheck);

        if (!user || !ok){
            throw new UnauthorizedException('Invalid Credentials');
        }
        
        const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email });

        const refreshToken = this.refreshTokens.generateToken();
        const refreshTtlSeconds = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS)
        const expiresAt = new Date(Date.now() + refreshTtlSeconds * 1000);

        await this.refreshTokens.create(user.id, refreshToken, expiresAt);

        return {accessToken, refreshToken};
    }

    async logout(refreshToken?: string): Promise<void> {
        if (!refreshToken)
            return;

        // Hard delete
        await this.refreshTokens.delete(refreshToken);
    }
}
