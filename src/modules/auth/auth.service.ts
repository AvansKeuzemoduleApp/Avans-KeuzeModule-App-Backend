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
import { Role } from './roles/role.entity';
import { UserRole } from './roles/user-role.entity';
import { LoggingHandler } from '../logger/LoggingHandler';

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
        const log = new LoggingHandler(this.logger, {
            level: 'log',
            codeLocation: 'assignRoleIfMissing',
            userData: {
                userId: userId,
                requestRoleName: roleName
            }
        });
        const normalizedRoleName = roleName.toLowerCase() as typeof roleName;

        const roleRepo = this.dataSource.getRepository(Role);
        const userRolesRepo = this.dataSource.getRepository(UserRole);

        const role = await roleRepo.findOne({ where: { name: normalizedRoleName } });
        if (!role) {
            log.Update("errorMessage", `Role '${normalizedRoleName}' not found in roles table`)
                .Update("level", "error").Send();
            throw new Error(`Role '${normalizedRoleName}' not found in roles table`);
        }

        const existing = await userRolesRepo.findOne({ where: { userId, roleId: role.id } });
        if (existing) {
            log.Update("message", "UserRole already exists").Send();
            return
        };

        try {
            await userRolesRepo.insert({ userId, roleId: role.id });
            log.Update("message", "UserRole assigned!").Send();
        } catch (err) {
            // Still handle races safely across DBs by ignoring unique violations.
            log.Update("errorMessage", `${err}`)
                .Update("level", "error").Update("programmerNote", "Probable Race Condition").Send();
            if (this.isDuplicateKeyError(err)) return;
            throw err;
        }
    }

    private normalizeEmail(email: string): string {
        return (email ?? '').trim().toLowerCase();
    }

    private isDuplicateKeyError(err: any): boolean {
        // Duplicate Key Error Code Handling
        const code = err?.code;
        const erno = err?.errno;
        const sqlState = err?.sqlState;

        // MySQL/MariaDB
        if (code === 'ER_DUP_ENTRY' || erno === 1062 || sqlState === '23000') return true;

        return false;
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
                new LoggingHandler(this.logger, {
                    level: 'warn',
                    codeLocation: 'register',
                    errorMessage: 'Duplicate registration attempt suppressed.',
                    userData: {
                        username: dto.email
                    },
                    programmerNote: "Prevent leaking \"email already exists\" via DB errors",
                    securityAlert: true
                }).Send();
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
                    const queryRunner = this.dataSource.createQueryRunner();
                    await queryRunner.connect();
                    await queryRunner.startTransaction();

                    try {
                        await queryRunner.query(
                            `DELETE FROM user_roles WHERE user_id = ?`,
                            [user.id],
                        );
                        await queryRunner.query(
                            `DELETE FROM student_profiles WHERE user_id = ?`,
                            [user.id],
                        );
                        await queryRunner.query(
                            `DELETE FROM users WHERE id = ?`,
                            [user.id],
                        );

                        await queryRunner.commitTransaction();
                    } catch (txError) {
                        await queryRunner.rollbackTransaction();
                        throw txError;
                    } finally {
                        await queryRunner.release();
                    }
                } catch (rollbackError) {
                    new LoggingHandler(this.logger, {
                        level: 'error',
                        codeLocation: 'register',
                        errorMessage: `Registration rollback failed: ${rollbackError}`,
                        userData: {
                            username: dto.email
                        },
                        securityAlert: true
                    }).Send();
                }

                new LoggingHandler(this.logger, {
                    level: 'error',
                    codeLocation: 'register',
                    errorMessage: `Registration post-create failed: ${error}`,
                    userData: {
                        username: dto.email
                    },
                    securityAlert: true
                }).Send();
                throw new InternalServerErrorException('Registration failed');
            }
        }
    }

    async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
        const log = new LoggingHandler(this.logger, {
            level: 'log',
            codeLocation: 'login',
            userData: {
                username: dto.email
            }
        });
        const user = await this.usersService.findByEmail(dto.email);
        log.UpdateUser("userId", user?.id)

        const hashToCheck = user?.passwordHash ?? this.dummyHash;
        const ok = await bcrypt.compare(dto.password, hashToCheck);

        if (!user || !ok) {
            // Generic Response
            log.Update("level", "warn").Update("message", "Invalid Credentials").Send();
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
        log.Update("message", "User Logged In.").Send();

        return { accessToken, refreshToken };
    }

    async logout(userId?: string, refreshToken?: string): Promise<void> {
        new LoggingHandler(this.logger, {
            level: 'log',
            codeLocation: 'logout',
            userData: {
                userId: userId
            }
        }).Send();
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
        const log = new LoggingHandler(this.logger, {
            level: 'log',
            codeLocation: 'refresh',
            userData: {
                refreshTokenUsed: refreshToken
            }
        })
        const rt = await this.refreshTokens.findValid(refreshToken);
        if (!rt) {
            log.Update("level", "warn").Update("message", "Refreshtoken not found").Send();
            throw new UnauthorizedException('Invalid Session');
        }

        const user = await this.usersService.findById(rt.userId);
        log.UpdateUser("userId", rt.userId);
        if (!user) {
            log.Update("level", "warn").Update("message", "userId not found")
                .Update("programmerNote", "pretty sure this shoudn't be possible?").Send();
            throw new UnauthorizedException('Invalid Session');
        }

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
        log.Update("message", "refreshed tokens").Send();

        return { accessToken, refreshToken: newRefreshToken };
    }
}
