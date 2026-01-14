import { InternalServerErrorException, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Role } from '../roles/role.entity';
import { UserRole } from '../roles/user-role.entity';

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService.register', () => {
    const makeService = (overrides?: Partial<{
        usersService: any;
        profileService: any;
        jwtService: any;
        refreshTokens: any;
        config: any;
        dataSource: any;
    }>) => {

        const usersService = overrides?.usersService ?? {
            createIfNotExists: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            bumpTokenVersion: jest.fn(),
        };

        const profileService = overrides?.profileService ?? {
            ensureStudentProfileExists: jest.fn(),
        };

        const jwtService = overrides?.jwtService ?? {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
        };

        const refreshTokens = overrides?.refreshTokens ?? {
            generateToken: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            findValid: jest.fn(),
            revokeAllForUser: jest.fn(),
        };

        const config = overrides?.config ?? {
            get: jest.fn().mockImplementation((k: string) => {
                if (k === 'DUMMY_HASH')
                    return '$2b$10$dummyhashdummyhashdummyhashdummyhashdummyhashdummy';

                return undefined;
            }),
        };

        const roleRepo = {
            findOne: jest.fn(),
        };

        const userRolesRepo = {
            findOne: jest.fn(),
            insert: jest.fn(),
        };

        const dataSource = overrides?.dataSource ?? {
            createQueryRunner: jest.fn(),
            getRepository: jest.fn().mockImplementation((entity: any) => {

                if (entity === Role)
                    return roleRepo;

                if (entity === UserRole)
                    return userRolesRepo;

                throw new Error(`Unexpected repository requested: ${entity?.name ?? entity}`);
            }),
        };

        const service = new AuthService(
            usersService,
            profileService,
            jwtService,
            refreshTokens,
            config,
            dataSource,
        );

        return { service, usersService, profileService, jwtService, refreshTokens, config, dataSource, roleRepo, userRolesRepo };
    };

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
        jest.spyOn(Logger.prototype, 'warn').mockImplementation();
        jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    });

    it('assigns default student role and creates student profile for a new user', async () => {
        (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hash');

        const { service, usersService, profileService, dataSource, roleRepo, userRolesRepo } = makeService();

        usersService.createIfNotExists.mockResolvedValue({ id: 'u1' });

        roleRepo.findOne.mockResolvedValue({ id: 123, name: 'student' });
        userRolesRepo.findOne.mockResolvedValue(null);
        userRolesRepo.insert.mockResolvedValue({} as any);

        profileService.ensureStudentProfileExists.mockResolvedValue({ userId: 'u1' });

        await service.register({ email: 'Test@Email.com', password: 'pw' } as any);

        expect(usersService.createIfNotExists).toHaveBeenCalled();
        expect(dataSource.getRepository).toHaveBeenCalledWith(Role);
        expect(dataSource.getRepository).toHaveBeenCalledWith(UserRole);
        expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { name: 'student' } });
        expect(userRolesRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'u1', roleId: 123 } });
        expect(userRolesRepo.insert).toHaveBeenCalledWith({ userId: 'u1', roleId: 123 });
        expect(profileService.ensureStudentProfileExists).toHaveBeenCalledWith('u1');
    });

    it('rolls back user artifacts in a transaction when post-create steps fail', async () => {
        (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hash');

        const queryRunner = {
            connect: jest.fn().mockResolvedValue(undefined),
            startTransaction: jest.fn().mockResolvedValue(undefined),
            query: jest.fn().mockResolvedValue(undefined),
            commitTransaction: jest.fn().mockResolvedValue(undefined),
            rollbackTransaction: jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
        };

        const roleRepo = { findOne: jest.fn() };
        const userRolesRepo = { findOne: jest.fn(), insert: jest.fn() };

        const { service, usersService, profileService } = makeService({
            dataSource: {
                createQueryRunner: jest.fn().mockReturnValue(queryRunner),
                getRepository: jest.fn().mockImplementation((entity: any) => {
                    if (entity === Role)
                        return roleRepo;

                    if (entity === UserRole)
                        return userRolesRepo;

                    throw new Error(`Unexpected repository requested: ${entity?.name ?? entity}`);
                }),
            },
        });

        usersService.createIfNotExists.mockResolvedValue({ id: 'u2' });

        roleRepo.findOne.mockResolvedValue({ id: 5, name: 'student' });
        userRolesRepo.findOne.mockResolvedValue(null);
        userRolesRepo.insert.mockResolvedValue({} as any);

        profileService.ensureStudentProfileExists.mockRejectedValue(new Error('boom'));

        await expect(service.register({ email: 'a@b.com', password: 'pw' } as any)).rejects.toBeInstanceOf(
            InternalServerErrorException,
        );

        expect(queryRunner.startTransaction).toHaveBeenCalled();
        expect(queryRunner.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM user_roles'),
            ['u2'],
        );
        expect(queryRunner.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM student_profiles'),
            ['u2'],
        );
        expect(queryRunner.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM users'),
            ['u2'],
        );
        expect(queryRunner.commitTransaction).toHaveBeenCalled();
        expect(queryRunner.release).toHaveBeenCalled();
    });

    it('does nothing when user already exists (duplicate registration)', async () => {
        (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hash');

        const { service, usersService, profileService, dataSource } = makeService();
        usersService.createIfNotExists.mockResolvedValue(null);

        await service.register({ email: 'x@y.com', password: 'pw' } as any);

        expect(profileService.ensureStudentProfileExists).not.toHaveBeenCalled();
        expect(dataSource.getRepository).not.toHaveBeenCalled();
    });
});
