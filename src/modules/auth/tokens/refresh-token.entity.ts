import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'user_id', type: 'char', length: 36 })
    userId!: string;

    @Index({ unique: true })
    @Column({ name: 'token_hash', type: 'varchar', length: 64})
    tokenHash!: string;

    @Column({ name: 'expires_at', type: 'datetime' })
    expiresAt!: Date;

    @Column({ name: 'revoked_at', type: 'datetime', nullable: true })
    revokedAt!: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}