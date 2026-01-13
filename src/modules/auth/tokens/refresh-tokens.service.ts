import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'node:crypto';
import { Repository } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

@Injectable()
export class RefreshTokensService {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly repo: Repository<RefreshToken>,
    ) { }

    hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    generateToken(): string {
        return crypto.randomBytes(32).toString('base64url');
    }


    async create(userId: string, refreshToken: string, expiresAt: Date): Promise<void> {
        const tokenHash = this.hashToken(refreshToken);

        const entity = this.repo.create({
            userId,
            tokenHash,
            expiresAt,
            revokedAt: null,
        });

        await this.repo.insert(entity);
    }

    async findValid(token: string) {
        const tokenHash = this.hashToken(token);
        const now = new Date();

        return this.repo.findOne({
            where: {
                tokenHash,
            },
        }).then((rt) => {
            if (!rt) return null;
            if (rt.revokedAt) return null;
            if (rt.expiresAt <= now) return null;
            return rt;
        });
    }


    async revoke(token: string): Promise<void> {
        const tokenHash = this.hashToken(token);

        const result = await this.repo.update({ tokenHash }, { revokedAt: new Date() });
        if (!result.affected) {
            throw new Error('Refresh token not found or already revoked');
        }
    }

    async revokeAllForUser(userId: string): Promise<void> {
        await this.repo.update({ userId, }, { revokedAt: new Date() });
        // idempotent: ok if user has no tokens
    }

    async delete(token: string): Promise<void> {
        const tokenHash = this.hashToken(token);

        await this.repo.delete({ tokenHash });
        // idempotent: ok if token doesn't exist
    }
}
