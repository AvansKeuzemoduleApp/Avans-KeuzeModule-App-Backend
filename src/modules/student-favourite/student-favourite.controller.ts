import { Body, Controller, Delete, Logger, Param, ParseIntPipe, Post, Req, UnauthorizedException } from '@nestjs/common';
import { StudentFavouriteService } from './student-favourite.service';
import { AddFavouriteDto } from './dto/add-favourite.dto';
import { LoggingHandler } from '../logger/LoggingHandler';

type RequestWithUser = Request & { user?: { sub: string }; method: string; originalUrl: string; path: string };

@Controller('student-favourite')
export class StudentFavouriteController {
    private readonly logger = new Logger(StudentFavouriteController.name);

    constructor(private readonly studentFavouriteService: StudentFavouriteService) { }

    @Post()
    async addFavourite(
        @Req() req: RequestWithUser,
        @Body() dto: AddFavouriteDto,
    ) {
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
            requestBody: { moduleId: dto.moduleId },
        });

        try {
            const result = await this.studentFavouriteService.addFavourite(userId, dto.moduleId);
            log.Update('httpResponse', 201).Send();
            return result;
        } catch (e) {
            log.Update('httpResponse', 500).Update('level', 'error').Update('errorMessage', e.message).Send();
            throw e;
        }
    }

    @Delete(':moduleId')
    async removeFavourite(
        @Req() req: RequestWithUser,
        @Param('moduleId', ParseIntPipe) moduleId: number,
    ) {
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
            requestBody: { moduleId },
        });

        try {
            await this.studentFavouriteService.removeFavourite(userId, moduleId);
            log.Update('httpResponse', 200).Send();
            return { message: 'Favourite removed successfully' };
        } catch (e) {
            log.Update('httpResponse', 500).Update('level', 'error').Update('errorMessage', e.message).Send();
            throw e;
        }
    }
}
