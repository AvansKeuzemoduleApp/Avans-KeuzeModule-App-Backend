import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { ROLES_KEY } from '../guards/roles.decorator';

describe('RolesGuard', () => {
    const makeContext = (req: any) => {
        const handler = () => undefined;
        const klass = class TestClass { };

        return {
            getHandler: () => handler,
            getClass: () => klass,
            switchToHttp: () => ({
                getRequest: () => req,
            }),
        } as any;
    };

    const makeReflector = (roles: string[] | undefined) => ({
        getAllAndOverride: jest.fn().mockImplementation((key: string) => {
            if (key !== ROLES_KEY) return undefined;
            return roles;
        }),
    });

    const makeUserRolesRepo = (roles: string[]) => ({
        find: jest.fn().mockResolvedValue(
            roles.map((name) => ({ userId: 'u1', roleId: 1, role: { id: 1, name } })),
        ),
    });

    it('allows when no roles are required', async () => {
        const reflector = makeReflector(undefined);
        const repo = makeUserRolesRepo([]);
        const guard = new RolesGuard(reflector as any, repo as any);

        await expect(guard.canActivate(makeContext({}) as any)).resolves.toBe(true);
        expect(repo.find).not.toHaveBeenCalled();
    });

    it('rejects invalid role configuration (unexpected role name)', async () => {
        const reflector = makeReflector(['admin']);
        const repo = makeUserRolesRepo(['teacher']);
        const guard = new RolesGuard(reflector as any, repo as any);

        await expect(guard.canActivate(makeContext({ user: { sub: 'u1' } }) as any)).rejects.toBeInstanceOf(
            ForbiddenException,
        );
        expect(repo.find).not.toHaveBeenCalled();
    });

    it('rejects when user is missing', async () => {
        const reflector = makeReflector(['teacher']);
        const repo = makeUserRolesRepo(['teacher']);
        const guard = new RolesGuard(reflector as any, repo as any);

        await expect(guard.canActivate(makeContext({}) as any)).rejects.toBeInstanceOf(ForbiddenException);
        expect(repo.find).not.toHaveBeenCalled();
    });

    it('allows when user has required role (case-insensitive)', async () => {
        const reflector = makeReflector(['Teacher']);
        const repo = makeUserRolesRepo(['teacher']);
        const guard = new RolesGuard(reflector as any, repo as any);

        await expect(
            guard.canActivate(makeContext({ user: { sub: 'u1' } }) as any),
        ).resolves.toBe(true);

        expect(repo.find).toHaveBeenCalledTimes(1);
        expect(repo.find).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    });

    it('rejects when user lacks required role', async () => {
        const reflector = makeReflector(['teacher']);
        const repo = makeUserRolesRepo(['student']);
        const guard = new RolesGuard(reflector as any, repo as any);

        await expect(
            guard.canActivate(makeContext({ user: { sub: 'u1' } }) as any),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });
});
