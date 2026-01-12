import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, Or, IsNull, MoreThan } from 'typeorm';
import { Module } from '../module/module.entity';
import { RecommendationCache } from './recommendation-cache.entity';
import { RecommendationOrder } from './recommendation-order.entity';
import { ProfileService } from '../profile/profile.service';
import { RecommendationResponseDto, RecommendedResponseItemDto } from './dto/recommendation-response.dto';
import { templateResponse } from './dto/template-fastapi-response';
import { ModuleResponseItemDto } from '../module/dto/module-response.dto';
import { defaultModuleFilters } from '../module/data/module-filters';
import { QueryRecommendationsDto } from './dto/query-recomendations.dto';
import { StudentFavourite } from '../student-favourite/student-favourite.entity';

const PAGE_SIZE = 10;

@Injectable()
export class RecommendationService {
    constructor(
        @InjectRepository(RecommendationCache)
        private readonly recommendationCacheRepo: Repository<RecommendationCache>,
        @InjectRepository(RecommendationOrder)
        private readonly recommendationOrderRepo: Repository<RecommendationOrder>,
        @InjectRepository(Module)
        private readonly moduleRepo: Repository<Module>,
        @InjectRepository(StudentFavourite)
        private readonly studentFavouriteRepo: Repository<StudentFavourite>,
        private readonly profileService: ProfileService,
    ) { }

    /**
     * Get recommendations for a user.
     * 
     * Checks student profile, looks for a valid cached recommendation,
     * otherwise returns template data.
     */
    async getRecommendationsForUser(query: QueryRecommendationsDto, userId: string): Promise<RecommendationResponseDto<RecommendedResponseItemDto>> {
        // Get student profile
        const profile = await this.profileService.ensureStudentProfileExists(userId);

        // Validate profile fields (semicolon-separated format)
        const interests = profile.interests?.trim() || '';
        const merits = profile.merits?.trim() || '';
        const goals = profile.goals?.trim() || '';

        const missingFields: string[] = [];
        if (!interests || interests === ';') {
            missingFields.push('interests');
        }
        if (!merits || merits === ';') {
            missingFields.push('merits');
        }
        if (!goals || goals === ';') {
            missingFields.push('goals');
        }

        if (missingFields.length > 0) {
            throw new BadRequestException(
                `Profile incomplete. Please set the following fields before requesting recommendations: ${missingFields.join(', ')}.`,
            );
        }
        // Look for cached recommendations matching profile criteria
        const now = new Date();
        const cachedRecommendation = await this.recommendationCacheRepo.findOne({
            where: {
                userId,
                interests: interests,
                merits: merits,
                goals: goals,
                expiresAt: Or(IsNull(), MoreThan(now)),
            },
            relations: ['recommendationOrders', 'recommendationOrders.moduleInformation'],
        });

        // Check if cache is valid (not expired)
        if (cachedRecommendation && (!cachedRecommendation.expiresAt || cachedRecommendation.expiresAt > now)) {
            return this.formatRecommendationResponse(cachedRecommendation, query, userId);
        }

        // TODO: run api request to the FastAPI
        // this can only be doen once we have the fastAPI
        // we need to update the db to have the reason of the recommendation.
        const response = templateResponse;

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
            userId: userId,
            interests: interests,
            merits: merits || undefined,
            goals: goals || undefined,
            modelVersion: response.model_version,
            expiresAt: expiresAt,
        });
        await this.recommendationCacheRepo.save(cache);

        const orders = validModuleIds.map((moduleId, index) =>
            this.recommendationOrderRepo.create({
                recommendationCacheId: cache.id,
                moduleInformationId: moduleId,
                recommendationOrder: index + 1,
            }),
        );

        try {
            await this.recommendationOrderRepo.save(orders);
        } catch (error) {
            console.error('Error saving recommendation orders:', error);
            throw new BadRequestException('Failed to save recommendations');
        }

        // Reload cache with relations
        const savedCache = await this.recommendationCacheRepo.findOne({
            where: { id: cache.id },
            relations: ['recommendationOrders', 'recommendationOrders.moduleInformation'],
        });

        if (!savedCache) {
            throw new BadRequestException('Failed to create recommendation cache');
        }

        return this.formatRecommendationResponse(savedCache, query, userId);
    }

    private async formatRecommendationResponse(
        cache: RecommendationCache,
        query: QueryRecommendationsDto,
        userId: string,
    ): Promise<RecommendationResponseDto<RecommendedResponseItemDto>> {
        const sortedOrders = cache.recommendationOrders.sort(
            (a, b) => a.recommendationOrder - b.recommendationOrder,
        );

        // Get user's favourites
        const favourites = await this.studentFavouriteRepo.find({
            where: { studentId: userId },
        });
        const favouriteModuleIds = new Set(favourites.map((f) => f.moduleId));

        // Map modules and add isFavourite flag
        let modules: RecommendedResponseItemDto[] = sortedOrders.map((order) => ({
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
            isFavourite: favouriteModuleIds.has(order.moduleInformation.id),
            explanation: "Not implemented yet."
        }));

        // Apply filters
        if (query.favourites) {
            modules = modules.filter((m) => m.isFavourite);
        }

        if (query.search) {
            const searchLower = query.search.toLowerCase();
            modules = modules.filter(
                (m) =>
                    m.name.toLowerCase().includes(searchLower) ||
                    m.description.toLowerCase().includes(searchLower) ||
                    m.learningoutcomes.toLowerCase().includes(searchLower) ||
                    (Array.isArray(m.module_tags) ? m.module_tags.join(' ') : m.module_tags).toLowerCase().includes(searchLower),
            );
        }

        if (query.location && query.location !== 'all') {
            modules = modules.filter((m) =>
                m.location.toLowerCase().includes(query.location!.toLowerCase()),
            );
        }

        if (query.level && query.level !== 'all') {
            modules = modules.filter((m) =>
                m.level.toLowerCase().includes(query.level!.toLowerCase()),
            );
        }

        // Apply pagination
        const totalCount = modules.length;
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);
        let currentPage = query.page || 1;
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = 1;
        }

        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const paginatedModules = modules.slice(startIndex, endIndex);

        const responseObject = {
            modelVersion: cache.modelVersion,
            createdAt: cache.createdAt,
            page: currentPage,
            pages: totalPages,
            data: paginatedModules,
            filters: {
                ...defaultModuleFilters,
                showFavourites: true,
            },
        };
        return responseObject;
    }
}
