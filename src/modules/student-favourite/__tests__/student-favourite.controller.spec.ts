import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { StudentFavouriteController } from '../student-favourite.controller';
import { StudentFavouriteService } from '../student-favourite.service';
import { AddFavouriteDto } from '../dto/add-favourite.dto';

describe('StudentFavouriteController', () => {
    let controller: StudentFavouriteController;
    let service: StudentFavouriteService;

    const mockStudentFavouriteService = {
        addFavourite: jest.fn(),
        removeFavourite: jest.fn(),
    };

    beforeEach(async () => {
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
        jest.spyOn(Logger.prototype, 'warn').mockImplementation();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [StudentFavouriteController],
            providers: [
                {
                    provide: StudentFavouriteService,
                    useValue: mockStudentFavouriteService,
                },
            ],
        }).compile();

        controller = module.get<StudentFavouriteController>(StudentFavouriteController);
        service = module.get<StudentFavouriteService>(StudentFavouriteService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('addFavourite', () => {
        it('should add a favourite successfully', async () => {
            const mockRequest = {
                user: { sub: 'user-123' },
            } as any;

            const dto: AddFavouriteDto = {
                moduleId: 1,
            };

            const expectedFavourite = {
                studentId: 'user-123',
                moduleId: 1,
            };

            mockStudentFavouriteService.addFavourite.mockResolvedValue(expectedFavourite);

            const result = await controller.addFavourite(mockRequest, dto);

            expect(result).toEqual(expectedFavourite);
            expect(mockStudentFavouriteService.addFavourite).toHaveBeenCalledWith('user-123', 1);
            expect(mockStudentFavouriteService.addFavourite).toHaveBeenCalledTimes(1);
        });

        it('should throw UnauthorizedException when user is not authenticated', async () => {
            const mockRequest = {
                user: undefined,
            } as any;

            const dto: AddFavouriteDto = {
                moduleId: 1,
            };

            await expect(controller.addFavourite(mockRequest, dto))
                .rejects
                .toThrow(UnauthorizedException);

            await expect(controller.addFavourite(mockRequest, dto))
                .rejects
                .toThrow('User not authenticated');

            expect(mockStudentFavouriteService.addFavourite).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when user.sub is missing', async () => {
            const mockRequest = {
                user: {},
            } as any;

            const dto: AddFavouriteDto = {
                moduleId: 1,
            };

            await expect(controller.addFavourite(mockRequest, dto))
                .rejects
                .toThrow(UnauthorizedException);

            expect(mockStudentFavouriteService.addFavourite).not.toHaveBeenCalled();
        });

        it('should handle different module IDs', async () => {
            const mockRequest = {
                user: { sub: 'user-123' },
            } as any;

            const dto1: AddFavouriteDto = { moduleId: 1 };
            const dto2: AddFavouriteDto = { moduleId: 42 };

            const favourite1 = { studentId: 'user-123', moduleId: 1 };
            const favourite2 = { studentId: 'user-123', moduleId: 42 };

            mockStudentFavouriteService.addFavourite
                .mockResolvedValueOnce(favourite1)
                .mockResolvedValueOnce(favourite2);

            const result1 = await controller.addFavourite(mockRequest, dto1);
            const result2 = await controller.addFavourite(mockRequest, dto2);

            expect(result1.moduleId).toBe(1);
            expect(result2.moduleId).toBe(42);
            expect(mockStudentFavouriteService.addFavourite).toHaveBeenCalledTimes(2);
        });

        it('should handle different users', async () => {
            const mockRequest1 = {
                user: { sub: 'user-123' },
            } as any;

            const mockRequest2 = {
                user: { sub: 'user-456' },
            } as any;

            const dto: AddFavouriteDto = { moduleId: 1 };

            const favourite1 = { studentId: 'user-123', moduleId: 1 };
            const favourite2 = { studentId: 'user-456', moduleId: 1 };

            mockStudentFavouriteService.addFavourite
                .mockResolvedValueOnce(favourite1)
                .mockResolvedValueOnce(favourite2);

            await controller.addFavourite(mockRequest1, dto);
            await controller.addFavourite(mockRequest2, dto);

            expect(mockStudentFavouriteService.addFavourite).toHaveBeenNthCalledWith(1, 'user-123', 1);
            expect(mockStudentFavouriteService.addFavourite).toHaveBeenNthCalledWith(2, 'user-456', 1);
        });

        it('should pass through service errors', async () => {
            const mockRequest = {
                user: { sub: 'user-123' },
            } as any;

            const dto: AddFavouriteDto = {
                moduleId: 999,
            };

            const error = new Error('Module not found');
            mockStudentFavouriteService.addFavourite.mockRejectedValue(error);

            await expect(controller.addFavourite(mockRequest, dto))
                .rejects
                .toThrow('Module not found');

            expect(mockStudentFavouriteService.addFavourite).toHaveBeenCalledWith('user-123', 999);
        });
    });

    describe('removeFavourite', () => {
        it('should remove a favourite successfully', async () => {
            const mockRequest = {
                user: { sub: 'user-123' },
            } as any;

            const moduleId = 1;

            mockStudentFavouriteService.removeFavourite.mockResolvedValue(undefined);

            const result = await controller.removeFavourite(mockRequest, moduleId);

            expect(result).toEqual({ message: 'Favourite removed successfully' });
            expect(mockStudentFavouriteService.removeFavourite).toHaveBeenCalledWith('user-123', 1);
            expect(mockStudentFavouriteService.removeFavourite).toHaveBeenCalledTimes(1);
        });

        it('should throw UnauthorizedException when user is not authenticated', async () => {
            const mockRequest = {
                user: undefined,
            } as any;

            const moduleId = 1;

            await expect(controller.removeFavourite(mockRequest, moduleId))
                .rejects
                .toThrow(UnauthorizedException);

            await expect(controller.removeFavourite(mockRequest, moduleId))
                .rejects
                .toThrow('User not authenticated');

            expect(mockStudentFavouriteService.removeFavourite).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException when user.sub is missing', async () => {
            const mockRequest = {
                user: {},
            } as any;

            const moduleId = 1;

            await expect(controller.removeFavourite(mockRequest, moduleId))
                .rejects
                .toThrow(UnauthorizedException);

            expect(mockStudentFavouriteService.removeFavourite).not.toHaveBeenCalled();
        });

        it('should handle different module IDs', async () => {
            const mockRequest = {
                user: { sub: 'user-123' },
            } as any;

            mockStudentFavouriteService.removeFavourite.mockResolvedValue(undefined);

            await controller.removeFavourite(mockRequest, 1);
            await controller.removeFavourite(mockRequest, 42);

            expect(mockStudentFavouriteService.removeFavourite).toHaveBeenNthCalledWith(1, 'user-123', 1);
            expect(mockStudentFavouriteService.removeFavourite).toHaveBeenNthCalledWith(2, 'user-123', 42);
            expect(mockStudentFavouriteService.removeFavourite).toHaveBeenCalledTimes(2);
        });

        it('should handle different users', async () => {
            const mockRequest1 = {
                user: { sub: 'user-123' },
            } as any;

            const mockRequest2 = {
                user: { sub: 'user-456' },
            } as any;

            const moduleId = 1;

            mockStudentFavouriteService.removeFavourite.mockResolvedValue(undefined);

            await controller.removeFavourite(mockRequest1, moduleId);
            await controller.removeFavourite(mockRequest2, moduleId);

            expect(mockStudentFavouriteService.removeFavourite).toHaveBeenNthCalledWith(1, 'user-123', 1);
            expect(mockStudentFavouriteService.removeFavourite).toHaveBeenNthCalledWith(2, 'user-456', 1);
        });

        it('should return success message even when favourite does not exist', async () => {
            const mockRequest = {
                user: { sub: 'user-123' },
            } as any;

            const moduleId = 999;

            mockStudentFavouriteService.removeFavourite.mockResolvedValue(undefined);

            const result = await controller.removeFavourite(mockRequest, moduleId);

            expect(result).toEqual({ message: 'Favourite removed successfully' });
            expect(mockStudentFavouriteService.removeFavourite).toHaveBeenCalledWith('user-123', 999);
        });

        it('should handle sequential removals', async () => {
            const mockRequest = {
                user: { sub: 'user-123' },
            } as any;

            mockStudentFavouriteService.removeFavourite.mockResolvedValue(undefined);

            const result1 = await controller.removeFavourite(mockRequest, 1);
            const result2 = await controller.removeFavourite(mockRequest, 2);
            const result3 = await controller.removeFavourite(mockRequest, 3);

            expect(result1.message).toBe('Favourite removed successfully');
            expect(result2.message).toBe('Favourite removed successfully');
            expect(result3.message).toBe('Favourite removed successfully');
            expect(mockStudentFavouriteService.removeFavourite).toHaveBeenCalledTimes(3);
        });

        it('should pass through service errors', async () => {
            const mockRequest = {
                user: { sub: 'user-123' },
            } as any;

            const moduleId = 1;

            const error = new Error('Database error');
            mockStudentFavouriteService.removeFavourite.mockRejectedValue(error);

            await expect(controller.removeFavourite(mockRequest, moduleId))
                .rejects
                .toThrow('Database error');

            expect(mockStudentFavouriteService.removeFavourite).toHaveBeenCalledWith('user-123', 1);
        });
    });
});
