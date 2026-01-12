import { Body, Controller, HttpCode, Post, Res, Req, UseGuards, Get, UnauthorizedException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto'
import { Public } from './guards/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { LoginProtectionService } from './login-protection/login-protection.service';

type RequestWithCookies = Request & { cookies?: Record<string, string>; user?: any };

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly loginProtection: LoginProtectionService,
) {}

    private getClientIp(req: RequestWithCookies): string {
        const forwardedFor = req.headers['x-forwarded-for'];
        if (forwardedFor) {
            const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
            return ips.split(',')[0].trim();
        }

        return req.ip || req.socket.remoteAddress || 'unknown';
    }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60 } })
    @Post('register')
    @HttpCode(200)
    async register(@Body() dto: RegisterDto) {
        await this.authService.register(dto);
        return { message: 'If registration is possible, the account will be created.' };
    }

    @Public()
    @Throttle({ default: { limit: 5, ttl: 60 } })
    @Post('login')
    @HttpCode(200)
    async login(
        @Body() dto: LoginDto,
        @Req() req: RequestWithCookies,
        @Res({ passthrough: true }) res: Response,
    ) {
        const ip = this.getClientIp(req);
        const { key, backoffMs } = this.loginProtection.check(ip);

        try {
            const { accessToken, refreshToken } = await this.authService.login(dto);
            this.loginProtection.recordSuccess(key);

            const accessName = process.env.AUTH_COOKIE_ACCESS ?? 'access_token';
            const refreshName = process.env.AUTH_COOKIE_REFRESH ?? 'refresh_token';

            const secure = (process.env.COOKIE_SECURE ?? 'false') === 'true';
            const rawSameSite = String(process.env.COOKIE_SAMESITE ?? 'lax').toLowerCase();
            const sameSite = (rawSameSite === 'strict' ? 'strict' : 'lax') as 'lax' | 'strict';

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
                path: '/api/auth',
                maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS ?? 604800) * 1000,
            });

        return { message: 'Login Successful' };
        } catch (e) {
            this.loginProtection.recordFailure(key);

            const backoffMs = this.loginProtection.getBackoff(key);

            if (backoffMs > 0) {
                res.set('Retry-After', Math.ceil(backoffMs / 1000).toString());
            }
            
            throw e;
        }
    }

    @Post('logout')
    @HttpCode(200)
    async logout(@Req() req: RequestWithCookies, @Res({ passthrough: true }) res: Response) {
        const accessName = process.env.AUTH_COOKIE_ACCESS ?? 'access_token';
        const refreshName = process.env.AUTH_COOKIE_REFRESH ?? 'refresh_token';

        const secure = (process.env.COOKIE_SECURE ?? 'false') === 'true';
        const rawSameSite = String(process.env.COOKIE_SAMESITE ?? 'lax').toLowerCase();
        const sameSite = (rawSameSite === 'strict' ? 'strict' : 'lax') as 'lax' | 'strict';

        const refreshToken = req.cookies?.[refreshName];

        const userId = req.user?.sub ? String(req.user.sub) : undefined;

        await this.authService.logout(userId, refreshToken);

        res.clearCookie(accessName, { path: '/', secure, sameSite });
        res.clearCookie(refreshName, { path: '/api/auth', secure, sameSite });

        return { message: 'Logged out' };
    }

    @Public()
    @Throttle({ default: { limit: 20, ttl: 60 } })
    @Post('refresh')
    @HttpCode(200)
    async refresh(@Req() req: RequestWithCookies, @Res({ passthrough: true }) res: Response){
        const accessName = process.env.AUTH_COOKIE_ACCESS ?? 'access_token';
        const refreshName = process.env.AUTH_COOKIE_REFRESH ?? 'refresh_token';

        const secure = (process.env.COOKIE_SECURE ?? 'false') === 'true';
        const rawSameSite = String(process.env.COOKIE_SAMESITE ?? 'lax').toLowerCase();
        const sameSite = (rawSameSite === 'strict' ? 'strict' : 'lax') as 'lax' | 'strict';

        const oldRefresh = req.cookies?.[refreshName];
        if (!oldRefresh)
            throw new UnauthorizedException('Invalid Credentials');

        const { accessToken, refreshToken } = await this.authService.refresh(oldRefresh);

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
            path: '/api/auth',
            maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS ?? 604800) * 1000,
        });

        return { message: 'Refresh' };
    }

    @Get('me')
    me(@Req() req: RequestWithCookies) {
        return { user: req.user };
    }
}
