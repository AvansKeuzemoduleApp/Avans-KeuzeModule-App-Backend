import { Controller, Get, Logger, Query, Req, UnauthorizedException } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RecommendationResponseDto } from './dto/recommendation-response.dto';
import { QueryRecommendationsDto } from './dto/query-recomendations.dto';
import { LoggingHandler } from '../logger/LoggingHandler';

type RequestWithUser = Request & { user?: { sub: string }; method: string; originalUrl: string };

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
            userData: { username: userId },
            level: "log",
            codeLocation: req.originalUrl,
            isResponseLog: true,
            httpResponse: null,
            httpMethod: req.method,
            userId,
        });

        try {
            const result = await this.recommendationService.getRecommendationsForUser(query, userId);
            log.Update('httpResponse', 200).Send();
            return result;
        } catch (e) {
            log.Update('httpResponse', 500).Update('level', 'error').Update('errorMessage', e.message).Send();
            throw e;
        }
    }
}
