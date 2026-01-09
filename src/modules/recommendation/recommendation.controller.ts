import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RecommendationResponseDto } from './dto/recommendation-response.dto';

type RequestWithUser = Request & { user?: { sub: string } };

@Controller('recommendation')
export class RecommendationController {
    constructor(private readonly recommendationService: RecommendationService) { }

    @Get()
    async getRecommendations(@Req() req: RequestWithUser): Promise<RecommendationResponseDto> {
        const userId = req.user?.sub;
        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.recommendationService.getRecommendationsForUser(userId);
    }
}
