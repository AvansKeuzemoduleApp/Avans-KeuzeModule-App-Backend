import { BadRequestException, Controller, Get, Logger, Query, Req, UnauthorizedException } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RecommendationResponseDto } from './dto/recommendation-response.dto';
import { QueryRecommendationsDto } from './dto/query-recomendations.dto';
import { LoggingHandler } from '../logger/LoggingHandler';

type RequestWithUser = Request & { user?: { sub: string }; method: string; originalUrl: string; path: string };

@Controller('recommendation')
export class RecommendationController {
    private readonly logger = new Logger(RecommendationController.name);

    constructor(private readonly recommendationService: RecommendationService) { }

    @Get()
    async getRecommendations(@Req() req: RequestWithUser, @Query() query: QueryRecommendationsDto): Promise<RecommendationResponseDto> {
        const userId = req.user?.sub;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }

        const log = new LoggingHandler(this.logger, {
            userData: { userId: userId },
            level: "log",
            codeLocation: req.path,
            originalUrl: req.originalUrl,
            httpMethod: req.method
        });

        try {
            const result = await this.recommendationService.getRecommendationsForUser(query, userId);
            log.update('httpResponse', 200).send();
            return result;
        } catch (e) {
            // Only log if not a BadRequestException
            if (!(e instanceof BadRequestException)) {
                log.update('httpResponse', 500).update('level', 'error').update('errorMessage', e.message).send();
            }
            throw e;
        }
    }
}
