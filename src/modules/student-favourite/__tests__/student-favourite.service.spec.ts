import { NotFoundException } from '@nestjs/common';
import { StudentFavouriteService } from '../student-favourite.service';

describe('StudentFavouriteService', () => {
    const makeService = (overrides?: Partial<{
        studentFavouriteRepo: any;
        moduleService: any;
    }>) => {
        const studentFavouriteRepo = overrides?.studentFavouriteRepo ?? {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
        };

        const moduleService = overrides?.moduleService ?? {
            findOne: jest.fn(),
        };

        const service = new StudentFavouriteService(
            studentFavouriteRepo,
            moduleService,
        );

        return { service, studentFavouriteRepo, moduleService };
    };

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('addFavourite', () => {
        it('should add a new favourite successfully', async () => {
            const { service, studentFavouriteRepo, moduleService } = makeService();

            const studentId = 'user-123';
            const moduleId = 1;

            // Module exists
            moduleService.findOne.mockResolvedValue({
                id: moduleId,
                name: 'Test Module',
            });

            // No existing favourite
            studentFavouriteRepo.findOne.mockResolvedValue(null);

            const newFavourite = {
                studentId,
                moduleId,
            };

            studentFavouriteRepo.create.mockReturnValue(newFavourite);
            studentFavouriteRepo.save.mockResolvedValue(newFavourite);

            const result = await service.addFavourite(studentId, moduleId);

            expect(moduleService.findOne).toHaveBeenCalledWith(moduleId, undefined);
            expect(studentFavouriteRepo.findOne).toHaveBeenCalledWith({
                where: { studentId, moduleId },
            });
            expect(studentFavouriteRepo.create).toHaveBeenCalledWith({
                studentId,
                moduleId,
            });
            expect(studentFavouriteRepo.save).toHaveBeenCalledWith(newFavourite);
            expect(result).toEqual(newFavourite);
        });

        it('should return existing favourite if already exists', async () => {
            const { service, studentFavouriteRepo, moduleService } = makeService();

            const studentId = 'user-123';
            const moduleId = 1;

            const existingFavourite = {
                studentId,
                moduleId,
            };

            // Module exists
            moduleService.findOne.mockResolvedValue({
                id: moduleId,
                name: 'Test Module',
            });

            // Existing favourite found
            studentFavouriteRepo.findOne.mockResolvedValue(existingFavourite);

            const result = await service.addFavourite(studentId, moduleId);

            expect(moduleService.findOne).toHaveBeenCalledWith(moduleId, undefined);
            expect(studentFavouriteRepo.findOne).toHaveBeenCalledWith({
                where: { studentId, moduleId },
            });
            expect(studentFavouriteRepo.create).not.toHaveBeenCalled();
            expect(studentFavouriteRepo.save).not.toHaveBeenCalled();
            expect(result).toEqual(existingFavourite);
        });

        it('should throw NotFoundException when module does not exist', async () => {
            const { service, studentFavouriteRepo, moduleService } = makeService();

            const studentId = 'user-123';
            const moduleId = 999;

            // Module not found
            moduleService.findOne.mockRejectedValue(
                new NotFoundException(`Module with ID ${moduleId} not found`)
            );

            await expect(service.addFavourite(studentId, moduleId))
                .rejects
                .toThrow(NotFoundException);

            expect(moduleService.findOne).toHaveBeenCalledWith(moduleId, undefined);
            expect(studentFavouriteRepo.findOne).not.toHaveBeenCalled();
            expect(studentFavouriteRepo.create).not.toHaveBeenCalled();
        });

        it('should handle race condition with duplicate entry error', async () => {
            const { service, studentFavouriteRepo, moduleService } = makeService();

            const studentId = 'user-123';
            const moduleId = 1;

            // Module exists
            moduleService.findOne.mockResolvedValue({
                id: moduleId,
                name: 'Test Module',
            });

            // No existing favourite initially
            const existingFavourite = {
                studentId,
                moduleId,
            };

            studentFavouriteRepo.findOne
                .mockResolvedValueOnce(null) // First check - not found
                .mockResolvedValueOnce(existingFavourite); // After error - found

            const newFavourite = {
                studentId,
                moduleId,
            };

            studentFavouriteRepo.create.mockReturnValue(newFavourite);

            // Simulate duplicate entry error
            const duplicateError = new Error('Duplicate entry');
            duplicateError['code'] = 'ER_DUP_ENTRY';
            studentFavouriteRepo.save.mockRejectedValue(duplicateError);

            const result = await service.addFavourite(studentId, moduleId);

            expect(studentFavouriteRepo.findOne).toHaveBeenCalledTimes(2);
            expect(result).toEqual(existingFavourite);
        });

        it('should handle race condition with duplicate entry message', async () => {
            const { service, studentFavouriteRepo, moduleService } = makeService();

            const studentId = 'user-123';
            const moduleId = 1;

            // Module exists
            moduleService.findOne.mockResolvedValue({
                id: moduleId,
                name: 'Test Module',
            });

            // No existing favourite initially
            const existingFavourite = {
                studentId,
                moduleId,
            };

            studentFavouriteRepo.findOne
                .mockResolvedValueOnce(null) // First check - not found
                .mockResolvedValueOnce(existingFavourite); // After error - found

            const newFavourite = {
                studentId,
                moduleId,
            };

            studentFavouriteRepo.create.mockReturnValue(newFavourite);

            // Simulate duplicate entry error with message
            const duplicateError = new Error('Duplicate entry for key PRIMARY');
            studentFavouriteRepo.save.mockRejectedValue(duplicateError);

            const result = await service.addFavourite(studentId, moduleId);

            expect(studentFavouriteRepo.findOne).toHaveBeenCalledTimes(2);
            expect(result).toEqual(existingFavourite);
        });

        it('should rethrow error if not duplicate entry', async () => {
            const { service, studentFavouriteRepo, moduleService } = makeService();

            const studentId = 'user-123';
            const moduleId = 1;

            // Module exists
            moduleService.findOne.mockResolvedValue({
                id: moduleId,
                name: 'Test Module',
            });

            // No existing favourite
            studentFavouriteRepo.findOne.mockResolvedValue(null);

            const newFavourite = {
                studentId,
                moduleId,
            };

            studentFavouriteRepo.create.mockReturnValue(newFavourite);

            // Simulate different error
            const error = new Error('Database connection failed');
            studentFavouriteRepo.save.mockRejectedValue(error);

            await expect(service.addFavourite(studentId, moduleId))
                .rejects
                .toThrow('Database connection failed');
        });

        it('should work with different student IDs', async () => {
            const { service, studentFavouriteRepo, moduleService } = makeService();

            const studentId1 = 'user-123';
            const studentId2 = 'user-456';
            const moduleId = 1;

            // Module exists
            moduleService.findOne.mockResolvedValue({
                id: moduleId,
                name: 'Test Module',
            });

            // No existing favourites
            studentFavouriteRepo.findOne.mockResolvedValue(null);

            const favourite1 = { studentId: studentId1, moduleId };
            const favourite2 = { studentId: studentId2, moduleId };

            studentFavouriteRepo.create
                .mockReturnValueOnce(favourite1)
                .mockReturnValueOnce(favourite2);

            studentFavouriteRepo.save
                .mockResolvedValueOnce(favourite1)
                .mockResolvedValueOnce(favourite2);

            const result1 = await service.addFavourite(studentId1, moduleId);
            const result2 = await service.addFavourite(studentId2, moduleId);

            expect(result1).toEqual(favourite1);
            expect(result2).toEqual(favourite2);
        });
    });

    describe('removeFavourite', () => {
        it('should remove an existing favourite', async () => {
            const { service, studentFavouriteRepo } = makeService();

            const studentId = 'user-123';
            const moduleId = 1;

            const existingFavourite = {
                studentId,
                moduleId,
            };

            studentFavouriteRepo.findOne.mockResolvedValue(existingFavourite);
            studentFavouriteRepo.remove.mockResolvedValue(existingFavourite);

            await service.removeFavourite(studentId, moduleId);

            expect(studentFavouriteRepo.findOne).toHaveBeenCalledWith({
                where: { studentId, moduleId },
            });
            expect(studentFavouriteRepo.remove).toHaveBeenCalledWith(existingFavourite);
        });

        it('should do nothing when favourite does not exist', async () => {
            const { service, studentFavouriteRepo } = makeService();

            const studentId = 'user-123';
            const moduleId = 999;

            studentFavouriteRepo.findOne.mockResolvedValue(null);

            await service.removeFavourite(studentId, moduleId);

            expect(studentFavouriteRepo.findOne).toHaveBeenCalledWith({
                where: { studentId, moduleId },
            });
            expect(studentFavouriteRepo.remove).not.toHaveBeenCalled();
        });

        it('should handle removal of different favourites', async () => {
            const { service, studentFavouriteRepo } = makeService();

            const studentId = 'user-123';
            const moduleId1 = 1;
            const moduleId2 = 2;

            const favourite1 = { studentId, moduleId: moduleId1 };
            const favourite2 = { studentId, moduleId: moduleId2 };

            studentFavouriteRepo.findOne
                .mockResolvedValueOnce(favourite1)
                .mockResolvedValueOnce(favourite2);

            studentFavouriteRepo.remove
                .mockResolvedValueOnce(favourite1)
                .mockResolvedValueOnce(favourite2);

            await service.removeFavourite(studentId, moduleId1);
            await service.removeFavourite(studentId, moduleId2);

            expect(studentFavouriteRepo.findOne).toHaveBeenCalledTimes(2);
            expect(studentFavouriteRepo.remove).toHaveBeenCalledTimes(2);
        });

        it('should be idempotent - multiple removals should not error', async () => {
            const { service, studentFavouriteRepo } = makeService();

            const studentId = 'user-123';
            const moduleId = 1;

            studentFavouriteRepo.findOne.mockResolvedValue(null);

            // Remove multiple times
            await service.removeFavourite(studentId, moduleId);
            await service.removeFavourite(studentId, moduleId);
            await service.removeFavourite(studentId, moduleId);

            expect(studentFavouriteRepo.findOne).toHaveBeenCalledTimes(3);
            expect(studentFavouriteRepo.remove).not.toHaveBeenCalled();
        });

        it('should handle different students removing the same module', async () => {
            const { service, studentFavouriteRepo } = makeService();

            const studentId1 = 'user-123';
            const studentId2 = 'user-456';
            const moduleId = 1;

            const favourite1 = { studentId: studentId1, moduleId };
            const favourite2 = { studentId: studentId2, moduleId };

            studentFavouriteRepo.findOne
                .mockResolvedValueOnce(favourite1)
                .mockResolvedValueOnce(favourite2);

            studentFavouriteRepo.remove
                .mockResolvedValueOnce(favourite1)
                .mockResolvedValueOnce(favourite2);

            await service.removeFavourite(studentId1, moduleId);
            await service.removeFavourite(studentId2, moduleId);

            expect(studentFavouriteRepo.findOne).toHaveBeenCalledWith({
                where: { studentId: studentId1, moduleId },
            });
            expect(studentFavouriteRepo.findOne).toHaveBeenCalledWith({
                where: { studentId: studentId2, moduleId },
            });
            expect(studentFavouriteRepo.remove).toHaveBeenCalledTimes(2);
        });
    });
});
