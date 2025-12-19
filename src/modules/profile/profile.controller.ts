import { Body, Controller, Get, Patch, Req, UnauthorizedException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

type RequestWithUser = Request & { user?: { sub: string } };

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    async getStudentProfile(@Req() req: RequestWithUser) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.profileService.getOrCreateStudentProfile(req.user.sub);
    }

    @Patch()
    async updateStudentProfile(
        @Req() req: RequestWithUser,
        @Body() dto: UpdateStudentProfileDto,
    ) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('User not authenticated');
        }
        return this.profileService.updateStudentProfile(req.user.sub, dto);
    }
}
