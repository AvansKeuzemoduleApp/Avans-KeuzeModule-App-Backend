import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';
import { RecommendationCache } from './recommendation-cache.entity';
import { Module } from '../module/module.entity';

@Entity('recommendation_order')
export class RecommendationOrder {
    @PrimaryColumn({ name: 'recommendation_cache_id' })
    recommendationCacheId!: string;

    @PrimaryColumn({ name: 'module_information_id' })
    moduleInformationId!: number;

    @ManyToOne(() => RecommendationCache, (cache) => cache.recommendationOrders)
    @JoinColumn({ name: 'recommendation_cache_id' })
    recommendationCache!: RecommendationCache;

    @ManyToOne(() => Module)
    @JoinColumn({ name: 'module_information_id' })
    moduleInformation!: Module;

    @Column({ name: 'recommendation_order', type: 'int' })
    recommendationOrder!: number;
}
