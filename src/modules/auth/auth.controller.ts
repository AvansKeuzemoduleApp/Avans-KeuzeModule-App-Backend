import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @HttpCode(200)
    async register(@Body() dto: RegisterDto) {
        await this.authService.register(dto);
        return { message: 'If registration is possible, the account will be created.' };
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const {accessToken} = await this.authService.login(dto);

        const cookieName = process.env.AUTH_COOKIE_NAME ?? 'access_token';
        const secure = (process.env.COOKIE_SECURE) === 'true';
        const sameSite = (process.env.COOKIE_SAMESITE) as 'lax' | 'strict' | 'none';

        res.cookie(cookieName, accessToken, {
            httpOnly: true,
            secure,
            sameSite,
            path: '/',
        });

        return { message: 'Logged in' };
    }
}
