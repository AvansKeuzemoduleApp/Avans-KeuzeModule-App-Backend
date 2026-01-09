import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ROLES_KEY } from './roles.decorator';

type RequestWithUser = Request & { user?: { sub?: string } };

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly dataSource: DataSource,
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

    const rows: Array<{ name: string }> = await this.dataSource.query(
    `
        SELECT r.name
        FROM user_roles ur
        INNER JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = ?
    `,
        [userId],
    );

    const userRoleNames = new Set(
        (rows ?? [])
            .map((r) => String(r?.name ?? '').trim().toLowerCase())
            .filter(Boolean),
        );

    const allowed = normalizedRequired;

    const ok = allowed.some((r) => userRoleNames.has(r));
    if (!ok)
        throw new ForbiddenException('Insufficient role');

    return true;
    }
}
