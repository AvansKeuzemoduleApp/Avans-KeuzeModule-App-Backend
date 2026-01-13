import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from './public.decorator';
import { UsersService } from '../../users/users.service';

type RequestWithCookies = Request & { cookies?: Record<string, string>; user?: any };

@Injectable()
export class JwtCookieAuthGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly reflector: Reflector,
        private readonly usersService: UsersService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) 
            return true;

        const req = context.switchToHttp().getRequest<RequestWithCookies>();
        const cookieName = process.env.AUTH_COOKIE_ACCESS ?? 'access_token';
        const token = req.cookies?.[cookieName];

        if (!token)
            throw new UnauthorizedException('Unauthorized');

        try {
            const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET });

            const userId = String(payload?.sub ?? '');
            if (userId) {
                const user = await this.usersService.findById(userId);
                if (!user) throw new UnauthorizedException('Unauthorized');

                const tokenVersion = Number(payload?.tv ?? 0);
                if (tokenVersion !== (user.tokenVersion ?? 0)) {
                    throw new UnauthorizedException('Unauthorized');
                }
            }

            req.user = payload;
            return true;
        } catch {
            throw new UnauthorizedException('Unauthorized');
        }
    }
}