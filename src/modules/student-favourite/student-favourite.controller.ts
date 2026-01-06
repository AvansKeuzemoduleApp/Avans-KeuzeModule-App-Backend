import { Body, Controller, Delete, Param, ParseIntPipe, Post, Req, UnauthorizedException } from '@nestjs/common';
import { StudentFavouriteService } from './student-favourite.service';
import { AddFavouriteDto } from './dto/add-favourite.dto';

type RequestWithUser = Request & { user?: { sub: string } };

@Controller('student-favourite')
export class StudentFavouriteController {
    constructor(private readonly studentFavouriteService: StudentFavouriteService) { }

    @Post()
    async addFavourite(
        @Req() req: RequestWithUser,
        @Body() dto: AddFavouriteDto,
    ) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.studentFavouriteService.addFavourite(req.user.sub, dto.moduleId);
    }

    @Delete(':moduleId')
    async removeFavourite(
        @Req() req: RequestWithUser,
        @Param('moduleId', ParseIntPipe) moduleId: number,
    ) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('User not authenticated');
        }
        await this.studentFavouriteService.removeFavourite(req.user.sub, moduleId);
        return { message: 'Favourite removed successfully' };
    }
}
