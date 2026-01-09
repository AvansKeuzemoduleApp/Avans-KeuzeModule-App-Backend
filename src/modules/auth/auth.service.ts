import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
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
        private readonly dataSource: DataSource,
    ) {
        const v = this.config.get<string>('DUMMY_HASH');
        if (!v)
            throw new Error('DUMMY_HASH missing in environment');

        this.dummyHash = v;
    }

    private async assignRoleIfMissing(userId: string, roleName: 'student' | 'teacher'): Promise<void> {
        // Role names are stored in DB table `roles.name`
        const rows: Array<{ id: number }> = await this.dataSource.query(
            `SELECT id FROM roles WHERE name = ? LIMIT 1`,
            [roleName],
        );

        const roleId = rows?.[0]?.id;
        if (!roleId) {
            throw new Error(`Role '${roleName}' not found in roles table`);
        }

        await this.dataSource.query(
            `INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
            [userId, roleId],
        );
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
                await this.assignRoleIfMissing(user.id, 'student');
                await this.profileService.ensureStudentProfileExists(user.id);
            } catch (error) {
                // Attempt rollback to avoid half-created accounts.
                try {
                    await this.dataSource.query(`DELETE FROM user_roles WHERE user_id = ?`, [user.id]);
                    await this.dataSource.query(`DELETE FROM student_profiles WHERE user_id = ?`, [user.id]);
                    await this.dataSource.query(`DELETE FROM users WHERE id = ?`, [user.id]);
                } catch (rollbackError) {
                    this.logger.error(`Registration rollback failed: ${rollbackError}`);
                }

                this.logger.error(`Registration post-create failed: ${error}`);
                throw new InternalServerErrorException('Registration failed');
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

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
            tv: user.tokenVersion ?? 0,
        });

        const refreshToken = this.refreshTokens.generateToken();
        const refreshTtlSeconds = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS ?? 604800);
        const expiresAt = new Date(Date.now() + refreshTtlSeconds * 1000);

        await this.refreshTokens.create(user.id, refreshToken, expiresAt);

        return { accessToken, refreshToken };
    }

    async logout(userId?: string, refreshToken?: string): Promise<void> {
        if (refreshToken) {
            // Logout should be idempotent
            await this.refreshTokens.delete(refreshToken).catch(() => undefined);
        }

        if (userId) {
            // Invalidate existing access tokens by bumping tokenVersion
            await this.usersService.bumpTokenVersion(userId);
            // Revoke any remaining refresh tokens for the user
            await this.refreshTokens.revokeAllForUser(userId).catch(() => undefined);
        }
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

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
            tv: user.tokenVersion ?? 0,
        });

        return { accessToken, refreshToken: newRefreshToken };
    }
}
