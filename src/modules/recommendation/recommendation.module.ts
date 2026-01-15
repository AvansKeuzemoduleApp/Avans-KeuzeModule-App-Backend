import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { RecommendationCache } from './recommendation-cache.entity';
import { RecommendationOrder } from './recommendation-order.entity';
import { ProfileModule } from '../profile/profile.module';
import { Module as ModuleEntity } from '../module/module.entity';
import { StudentFavourite } from '../student-favourite/student-favourite.entity';
import { FastApiClientService } from './fastapi-client.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([RecommendationCache, RecommendationOrder, ModuleEntity, StudentFavourite]),
        ProfileModule,
    ],
    providers: [RecommendationService, FastApiClientService],
    controllers: [RecommendationController],
})
export class RecommendationModule { }
