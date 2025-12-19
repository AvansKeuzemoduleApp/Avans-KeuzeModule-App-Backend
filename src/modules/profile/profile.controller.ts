import { Controller, Get, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';

type RequestWithUser = Request & { user?: { sub: string } };

@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get()
    async getStudentProfile(@Req() req: RequestWithUser) {
        const userId = req.user?.sub;
        return this.profileService.getOrCreateStudentProfile(userId!);
    }
}
