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
            securityAlert: true,
            moduleData: {
                moduleId: dto.moduleId
            }
        });

        try {
            const result = await this.studentFavouriteService.addFavourite(userId, dto.moduleId);
            log.update('httpResponse', 201).send();
            return result;
        } catch (e) {
            log.update('httpResponse', 500).update('level', 'error').update('errorMessage', e.message).send();
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
            securityAlert: true,
            moduleData: {
                moduleId: moduleId
            }
        });

        try {
            await this.studentFavouriteService.removeFavourite(userId, moduleId);
            log.update('httpResponse', 200).send();
            return { message: 'Favourite removed successfully' };
        } catch (e) {
            log.update('httpResponse', 500).update('level', 'error').update('errorMessage', e.message).send();
            throw e;
        }
    }
}
