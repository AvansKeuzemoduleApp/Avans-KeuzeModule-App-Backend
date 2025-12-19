import { Body, Controller, HttpCode, Post, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
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
        const {accessToken, refreshToken} = await this.authService.login(dto);

        const accessName = process.env.AUTH_COOKIE_NAME ?? 'access_token';
        const refreshName = process.env.AUTH_COOKIE_REFRESH ?? 'refresh_token';

        const secure = (process.env.COOKIE_SECURE) === 'true';
        const sameSite = (process.env.COOKIE_SAMESITE) as 'lax' | 'strict' | 'none';

        res.cookie(accessName, accessToken, {
            httpOnly: true,
            secure,
            sameSite,
            path: '/',
            maxAge: Number(process.env.ACCESS_TOKEN_EXPIRES_IN_SECONDS ?? 900) * 1000,
        });

        res.cookie(refreshName, refreshToken, {
            httpOnly: true,
            secure,
            sameSite,
            path: '/auth',
            maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS ?? 604800) * 1000,
        });

        return { message: 'Logged in' };
    }

    @Post('logout')
    @HttpCode(200)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const accessName = process.env.AUTH_COOKIE_ACCESS ?? 'access_token';
        const refreshName = process.env.AUTH_COOKIE_REFRESH ?? 'refresh_token';

        const refreshToken = req.cookies?.[refreshName];

        await this.authService.logout(refreshToken);

        res.clearCookie(accessName, { path: '/' });
        res.clearCookie(refreshName, { path: '/auth' });

        return { message: 'Logged out' };
    }
}
