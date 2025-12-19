import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

type RequestWithUser = Request & { user?: { sub: string } };

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    async getStudentProfile(@Req() req: RequestWithUser) {
        const userId = req.user?.sub;
        return this.profileService.getOrCreateStudentProfile(userId!);
    }

    @Patch()
    async updateStudentProfile(
        @Req() req: RequestWithUser,
        @Body() dto: UpdateStudentProfileDto,
    ) {
        const userId = req.user?.sub;
        return this.profileService.updateStudentProfile(userId!, dto);
    }
}
