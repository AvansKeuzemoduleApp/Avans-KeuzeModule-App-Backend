import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { RecommendationOrder } from './recommendation-order.entity';

@Entity('recommendation_cache')
export class RecommendationCache {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id' })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ type: 'text' })
    interests!: string;

    @Column({ type: 'text', nullable: true })
    merits?: string;

    @Column({ type: 'text', nullable: true })
    goals?: string;

    @Column({ name: 'model_version' })
    modelVersion!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
    expiresAt?: Date;

    @OneToMany(() => RecommendationOrder, (order) => order.recommendationCache)
    recommendationOrders!: RecommendationOrder[];
}
