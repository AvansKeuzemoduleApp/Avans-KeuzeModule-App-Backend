import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @HttpCode(200)
    async register(@Body() dto: RegisterDto) {
        await this.authService.register(dto);
        return { message: 'If registration is possible, the account will be created.' };
    }
}
