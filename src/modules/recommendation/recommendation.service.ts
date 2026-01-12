import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Module } from '../module/module.entity';
import { RecommendationCache } from './recommendation-cache.entity';
import { RecommendationOrder } from './recommendation-order.entity';
import { ProfileService } from '../profile/profile.service';
import { RecommendationResponseDto } from './dto/recommendation-response.dto';
import { templateResonse } from './dto/template-fastapi-response';
import { ModuleResponseItemDto } from '../module/dto/module-response.dto';
import { defaultModuleFilters } from '../module/dto/module-filters';
import { QueryRecommendationsDto } from './dto/query-recomendations.dto';

@Injectable()
export class RecommendationService {
    constructor(
        @InjectRepository(RecommendationCache)
        private readonly recommendationCacheRepo: Repository<RecommendationCache>,
        @InjectRepository(RecommendationOrder)
        private readonly recommendationOrderRepo: Repository<RecommendationOrder>,
        @InjectRepository(Module)
        private readonly moduleRepo: Repository<Module>,
        private readonly profileService: ProfileService,
    ) { }

    /**
     * Get recommendations for a user.
     * 
     * Checks student profile, looks for a valid cached recommendation,
     * otherwise returns template data.
     */
    async getRecommendationsForUser(query: QueryRecommendationsDto, userId: string): Promise<RecommendationResponseDto<ModuleResponseItemDto>> {
        // Get student profile
        const profile = await this.profileService.ensureStudentProfileExists(userId);

        // Validate profile fields (trim whitespace and special chars)
        const interests = profile.interests?.trim().replace(/[^\w\s]/gi, '').trim() || '';
        const merits = profile.merits?.trim().replace(/[^\w\s]/gi, '').trim() || '';
        const goals = profile.goals?.trim().replace(/[^\w\s]/gi, '').trim() || '';

        if (!interests || !merits || !goals) {
            throw new BadRequestException('Profile incomplete. Please set your interests, merits, and goals before requesting recommendations.');
        }

        // Look for cached recommendations matching profile criteria
        const now = new Date();
        const cachedRecommendation = await this.recommendationCacheRepo.findOne({
            where: {
                userId,
                interests: profile.interests,
                merits: profile.merits,
                goals: profile.goals,
                // expiresAt is either null (never expires) or greater than now
            },
            relations: ['recommendationOrders', 'recommendationOrders.moduleInformation'],
        });

        // Check if cache is valid (not expired)
        if (cachedRecommendation && (!cachedRecommendation.expiresAt || cachedRecommendation.expiresAt > now)) {
            return this.formatRecommendationResponse(cachedRecommendation);
        }

        // TODO: run api request to the FastAPI
        const response = templateResonse;

        // Fetch modules by IDs, skipping any that don't exist
        const modules = await this.moduleRepo.find({
            where: {
                id: In(response.module_order),
            },
        });

        // Create a map for quick lookup
        const moduleMap = new Map(modules.map((m) => [m.id, m]));

        // Filter to only existing modules in the correct order
        const validModuleIds = response.module_order.filter((id) => moduleMap.has(id));

        // Calculate expiration date
        const cacheHours = parseInt(process.env.RECOMMENDATION_CACHE_HOURS || '24', 10);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + cacheHours);

        const cache = this.recommendationCacheRepo.create({
            userId,
            interests: profile.interests,
            merits: profile.merits,
            goals: profile.goals,
            modelVersion: response.model_version,
            expiresAt,
        });
        await this.recommendationCacheRepo.save(cache);

        const orders = validModuleIds.map((moduleId, index) =>
            this.recommendationOrderRepo.create({
                recommendationCacheId: cache.id,
                moduleInformationId: moduleId,
                recommendationOrder: index,
            }),
        );

        try {
            await this.recommendationOrderRepo.save(orders);
        } catch (error) {
            console.error('Error saving recommendation orders:', error);
            throw new BadRequestException(`Failed to save recommendations: ${error.message}`);
        }

        // Reload cache with relations
        const savedCache = await this.recommendationCacheRepo.findOne({
            where: { id: cache.id },
            relations: ['recommendationOrders', 'recommendationOrders.moduleInformation'],
        });

        if (!savedCache) {
            throw new BadRequestException('Failed to create recommendation cache');
        }

        return this.formatRecommendationResponse(savedCache);
    }

    private formatRecommendationResponse(cache: RecommendationCache): RecommendationResponseDto<ModuleResponseItemDto> {
        const sortedOrders = cache.recommendationOrders.sort(
            (a, b) => a.recommendationOrder - b.recommendationOrder,
        );

        const modules: ModuleResponseItemDto[] = sortedOrders.map((order) => ({
            id: order.moduleInformation.id,
            name: order.moduleInformation.name,
            shortdescription: order.moduleInformation.shortDescription,
            description: order.moduleInformation.description,
            learningoutcomes: order.moduleInformation.learningOutcomes,
            module_tags: order.moduleInformation.moduleTags,
            studycredit: order.moduleInformation.studyCredit,
            location: order.moduleInformation.location,
            contact_id: order.moduleInformation.contactId,
            level: order.moduleInformation.level,
            popularity_score: order.moduleInformation.popularityScore,
            estimated_difficulty: order.moduleInformation.estimatedDifficulty,
            available_spots: order.moduleInformation.availableSpots,
            start_date: order.moduleInformation.startDate,
            isFavourite: false, // TODO: add favourites data
        }));

        // TODO: apply pagination

        const responseObject = {
            modelVersion: cache.modelVersion,
            createdAt: cache.createdAt,
            page: 1,
            pages: 1,
            data: modules,
            filters: defaultModuleFilters
        }
        responseObject.filters.showFavourites = true;
        return responseObject;
    }


}
