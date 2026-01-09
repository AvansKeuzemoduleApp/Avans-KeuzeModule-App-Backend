import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '../roles/user-role.entity';

type RequestWithUser = Request & { user?: { sub?: string } };

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @InjectRepository(UserRole)
        private readonly userRolesRepo: Repository<UserRole>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

    if (!requiredRoles || requiredRoles.length === 0) 
        return true;

    const allowedConfigRoles = new Set(['student', 'teacher']);
    const normalizedRequired = requiredRoles
        .map((r) => String(r).trim().toLowerCase())
        .filter(Boolean);

    if (normalizedRequired.some((r) => !allowedConfigRoles.has(r))) {
        throw new ForbiddenException('Invalid role configuration');
    }

    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = String(req.user?.sub ?? '').trim();

    if (!userId)
        throw new ForbiddenException('Missing user');

    const userRoles = await this.userRolesRepo.find({ where: { userId } });
    const userRoleNames = new Set(
        (userRoles ?? [])
            .map((ur) => String(ur?.role?.name ?? '').trim().toLowerCase())
            .filter(Boolean),
    );

    const allowed = normalizedRequired;

    const ok = allowed.some((r) => userRoleNames.has(r));
    if (!ok)
        throw new ForbiddenException('Insufficient role');

    return true;
    }
}
