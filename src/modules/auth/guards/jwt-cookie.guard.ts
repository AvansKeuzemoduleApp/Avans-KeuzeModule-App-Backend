import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

type RequestWithCookies = Request & { cookies?: Record<string, string>; user?: any };

@Injectable()
export class JwtCookieAuthGuard implements CanActivate {
    constructor(private readonly jwt: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<RequestWithCookies>();

        const cookieName = process.env.AUTH_COOKIE_ACCESS ?? 'access_token';
        const token = req.cookies?.[cookieName];

        if (!token)
            throw new UnauthorizedException('Unauthorized');

        try {
            const payload = await this.jwt.verifyAsync(token);
            req.user = payload;
            return true;
        } catch {
            throw new UnauthorizedException('Unauthorized');
        }
    }
}