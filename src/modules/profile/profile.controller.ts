import { Body, Controller, Get, Logger, Patch, Req, UnauthorizedException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { LoggingHandler } from '../logger/LoggingHandler';

type RequestWithUser = Request & { user?: { sub: string }; method: string; originalUrl: string; path: string };

@Controller('profile')
export class ProfileController {
    private readonly logger = new Logger(ProfileController.name);

    constructor(private readonly profileService: ProfileService) { }

    @Get()
    async getStudentProfile(@Req() req: RequestWithUser) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('User not authenticated');
        }

        const userId = req.user.sub;
        const log = new LoggingHandler(this.logger, {
            userData: { userId: userId },
            level: "log",
            codeLocation: req.path,
            originalUrl: req.originalUrl,
            httpMethod: req.method,
        });

        try {
            const result = await this.profileService.getOrCreateStudentProfile(userId);
            log.Update('httpResponse', 200).Send();
            return result;
        } catch (e) {
            log.Update('httpResponse', 500).Update('level', 'error').Update('errorMessage', e.message).Send();
            throw e;
        }
    }

    @Patch()
    async updateStudentProfile(
        @Req() req: RequestWithUser,
        @Body() dto: UpdateStudentProfileDto,
    ) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('User not authenticated');
        }

        const userId = req.user.sub;
        const log = new LoggingHandler(this.logger, {
            userData: {
                userId: userId,
                requestGoals: dto.goals != null ? dto.goals : undefined,
                requestMerits: dto.merits != null ? dto.merits : undefined,
                requestInterests: dto.interests != null ? dto.interests : undefined
            },
            level: "log",
            codeLocation: req.path,
            originalUrl: req.originalUrl,
            httpMethod: req.method,
            securityAlert: true
        });

        try {
            const result = await this.profileService.updateStudentProfile(userId, dto);
            log.Update('httpResponse', 200).Send();
            return result;
        } catch (e) {
            log.Update('httpResponse', 500).Update('level', 'error').Update('errorMessage', e.message).Send();
            throw e;
        }
    }
}
