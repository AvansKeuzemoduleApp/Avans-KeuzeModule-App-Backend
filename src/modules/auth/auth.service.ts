import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ProfileService } from '../profile/profile.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokensService } from './tokens/refresh-tokens.service';

@Injectable()
export class AuthService {
    private readonly dummyHash: string;
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly usersService: UsersService,
        private readonly profileService: ProfileService,
        private readonly jwtService: JwtService,
        private readonly refreshTokens: RefreshTokensService,
        private readonly config: ConfigService,
    ) {
        const v = this.config.get<string>('DUMMY_HASH');
        if (!v)
            throw new Error('DUMMY_HASH missing in environment');

        this.dummyHash = v;
    }

    private normalizeEmail(email: string): string{
        return (email ?? '').trim().toLowerCase();
    }

    private isDuplicateKeyError(err: any): boolean{
        // Duplicate Key Error Code Handling
        const code = err?.code;
        const erno = err?.errno;
        const sqlState = err?.sqlState;

        return code === 'ER_DUP_ENTRY' || erno === 1062 || sqlState === '23000';
    }

    async register(dto: RegisterDto): Promise<void> {
        const email = this.normalizeEmail(dto.email);
        const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
        const passwordHash = await bcrypt.hash(dto.password, rounds);

        let user: any;
        try {
            user = await this.usersService.createIfNotExists(email, passwordHash);
        } catch (err) {
            // Prevent leaking "email already exists" via DB errors
            if (this.isDuplicateKeyError(err)) {
                this.logger.warn(`Duplicate registration attempt suppressed.`);
                return;
            }

        throw err;
        }

        if (user) {
            try {
                await this.profileService.ensureStudentProfileExists(user.id);
            } catch (error) {
                this.logger.error(`Failed to create student profile during registration: ${error}`);
            }
        }
    }

    async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
        const user = await this.usersService.findByEmail(dto.email);

        const hashToCheck = user?.passwordHash ?? this.dummyHash;
        const ok = await bcrypt.compare(dto.password, hashToCheck);

        if (!user || !ok) {
            // Generic Response
            throw new UnauthorizedException('Invalid Credentials');
        }

        const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email });

        const refreshToken = this.refreshTokens.generateToken();
        const refreshTtlSeconds = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS ?? 604800);
        const expiresAt = new Date(Date.now() + refreshTtlSeconds * 1000);

        await this.refreshTokens.create(user.id, refreshToken, expiresAt);

        return { accessToken, refreshToken };
    }

    async logout(refreshToken?: string): Promise<void> {
        if (!refreshToken)
            return;

        // Hard delete
        await this.refreshTokens.delete(refreshToken);
    }


    async refresh(refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> {
        const rt = await this.refreshTokens.findValid(refreshToken);
        if (!rt)
            throw new UnauthorizedException('Invalid Session');

        const user = await this.usersService.findById(rt.userId);
        if (!user)
            throw new UnauthorizedException('Invalid Session');

        await this.refreshTokens.delete(refreshToken);

        const newRefreshToken = this.refreshTokens.generateToken();
        const refreshTtlSeconds = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS ?? 604800);
        const expiresAt = new Date(Date.now() + refreshTtlSeconds * 1000);
        await this.refreshTokens.create(user.id, newRefreshToken, expiresAt);

        const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email });

        return { accessToken, refreshToken: newRefreshToken };
    }
}
