import { Test, TestingModule } from '@nestjs/testing';
import { ModuleAdminController } from '../module.admin.controller';
import { ModuleService } from '../module.service';
import { CreateModuleDto } from '../dto/create-module.dto';
import { UpdateModuleDto } from '../dto/update-module.dto';
import { JwtCookieAuthGuard } from '../../auth/guards/jwt-cookie.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Logger } from '@nestjs/common';

describe('ModuleAdminController', () => {
    let controller: ModuleAdminController;
    let service: ModuleService;

    const mockModuleService = {
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockRequest = {
        user: { sub: 'test-user-id' },
        method: 'POST',
        originalUrl: '/api/admin/modules',
    } as any;

    beforeEach(async () => {
        jest.spyOn(Logger.prototype, 'log').mockImplementation();
        jest.spyOn(Logger.prototype, 'error').mockImplementation();
        jest.spyOn(Logger.prototype, 'warn').mockImplementation();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ModuleAdminController],
            providers: [
                {
                    provide: ModuleService,
                    useValue: mockModuleService,
                },
            ],
        })
            .overrideGuard(JwtCookieAuthGuard)
            .useValue({ canActivate: jest.fn(() => true) })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: jest.fn(() => true) })
            .compile();

        controller = module.get<ModuleAdminController>(ModuleAdminController);
        service = module.get<ModuleService>(ModuleService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new module', async () => {
            const dto: CreateModuleDto = {
                name: 'New Module',
                shortdescription: 'Short description',
                description: 'Long description',
                studycredit: 15,
                location: 'Breda',
                contact_id: 1,
                level: 'Bachelor',
                learningoutcomes: 'Learning outcomes',
                module_tags: ['tag1', 'tag2'],
                estimated_difficulty: 3,
                available_spots: 20,
                start_date: '2026-09-01',
            };

            const expectedModule = {
                id: 1,
                name: 'New Module',
                shortDescription: 'Short description',
                description: 'Long description',
                studyCredit: 15,
                location: 'Breda',
                contactId: 1,
                level: 'Bachelor',
                learningOutcomes: 'Learning outcomes',
                moduleTags: ['tag1', 'tag2'],
                popularityScore: 0,
                estimatedDifficulty: 3,
                availableSpots: 20,
                startDate: new Date('2026-09-01'),
            };

            mockModuleService.create.mockResolvedValue(expectedModule);

            const result = await controller.create(dto, mockRequest);

            expect(result).toEqual(expectedModule);
            expect(mockModuleService.create).toHaveBeenCalledWith(dto);
            expect(mockModuleService.create).toHaveBeenCalledTimes(1);
        });

        it('should handle create with minimal tags', async () => {
            const dto: CreateModuleDto = {
                name: 'Minimal Module',
                shortdescription: 'Short',
                description: 'Description',
                studycredit: 30,
                location: 'Tilburg',
                contact_id: 2,
                level: 'Master',
                learningoutcomes: 'Outcomes',
                module_tags: [],
                estimated_difficulty: 5,
                available_spots: 10,
                start_date: '2027-01-01',
            };

            const expectedModule = {
                id: 2,
                ...dto,
                shortDescription: dto.shortdescription,
                studyCredit: dto.studycredit,
                contactId: dto.contact_id,
                learningOutcomes: dto.learningoutcomes,
                moduleTags: dto.module_tags,
                popularityScore: 0,
                estimatedDifficulty: dto.estimated_difficulty,
                availableSpots: dto.available_spots,
                startDate: dto.start_date,
            };

            mockModuleService.create.mockResolvedValue(expectedModule);

            const result = await controller.create(dto, mockRequest);

            expect(result).toEqual(expectedModule);
            expect(mockModuleService.create).toHaveBeenCalledWith(dto);
        });

        it('should pass through service errors on create', async () => {
            const dto: CreateModuleDto = {
                name: 'Error Module',
                shortdescription: 'Short',
                description: 'Description',
                studycredit: 15,
                location: 'Breda',
                contact_id: 999,
                level: 'Bachelor',
                learningoutcomes: 'Outcomes',
                module_tags: ['tag1'],
                estimated_difficulty: 3,
                available_spots: 20,
                start_date: '2026-09-01',
            };

            const error = new Error('Invalid contact_id');
            mockModuleService.create.mockRejectedValue(error);

            await expect(controller.create(dto, mockRequest)).rejects.toThrow('Invalid contact_id');
            expect(mockModuleService.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('update', () => {
        it('should update an existing module', async () => {
            const dto: UpdateModuleDto = {
                name: 'Updated Module Name',
                location: 'Den Bosch',
            };

            const expectedModule = {
                id: 1,
                name: 'Updated Module Name',
                shortDescription: 'Original short',
                description: 'Original description',
                studyCredit: 15,
                location: 'Den Bosch',
                contactId: 1,
                level: 'Bachelor',
                learningOutcomes: 'Original outcomes',
                moduleTags: ['tag1'],
                popularityScore: 5,
                estimatedDifficulty: 3,
                availableSpots: 20,
                startDate: new Date('2026-09-01'),
            };

            mockModuleService.update.mockResolvedValue(expectedModule);

            const result = await controller.update(1, dto, mockRequest);

            expect(result).toEqual(expectedModule);
            expect(mockModuleService.update).toHaveBeenCalledWith(1, dto);
            expect(mockModuleService.update).toHaveBeenCalledTimes(1);
        });

        it('should update only specified fields', async () => {
            const dto: UpdateModuleDto = {
                available_spots: 25,
            };

            const expectedModule = {
                id: 5,
                name: 'Module Name',
                shortDescription: 'Short',
                description: 'Description',
                studyCredit: 15,
                location: 'Breda',
                contactId: 1,
                level: 'Bachelor',
                learningOutcomes: 'Outcomes',
                moduleTags: ['tag1'],
                popularityScore: 0,
                estimatedDifficulty: 3,
                availableSpots: 25,
                startDate: new Date('2026-09-01'),
            };

            mockModuleService.update.mockResolvedValue(expectedModule);

            const result = await controller.update(5, dto, mockRequest);

            expect(result.availableSpots).toBe(25);
            expect(mockModuleService.update).toHaveBeenCalledWith(5, dto);
        });

        it('should update multiple fields at once', async () => {
            const dto: UpdateModuleDto = {
                name: 'New Name',
                shortdescription: 'New short',
                description: 'New description',
                studycredit: 30,
                level: 'Master',
            };

            const expectedModule = {
                id: 3,
                name: 'New Name',
                shortDescription: 'New short',
                description: 'New description',
                studyCredit: 30,
                location: 'Breda',
                contactId: 1,
                level: 'Master',
                learningOutcomes: 'Outcomes',
                moduleTags: ['tag1'],
                popularityScore: 0,
                estimatedDifficulty: 3,
                availableSpots: 20,
                startDate: new Date('2026-09-01'),
            };

            mockModuleService.update.mockResolvedValue(expectedModule);

            const result = await controller.update(3, dto, mockRequest);

            expect(result).toEqual(expectedModule);
            expect(mockModuleService.update).toHaveBeenCalledWith(3, dto);
        });

        it('should pass through service errors on update', async () => {
            const dto: UpdateModuleDto = {
                name: 'Updated Name',
            };

            const error = new Error('Module with ID 999 not found');
            mockModuleService.update.mockRejectedValue(error);

            await expect(controller.update(999, dto, mockRequest)).rejects.toThrow('Module with ID 999 not found');
            expect(mockModuleService.update).toHaveBeenCalledWith(999, dto);
        });

        it('should handle empty update DTO', async () => {
            const dto: UpdateModuleDto = {};

            const expectedModule = {
                id: 1,
                name: 'Original Name',
                shortDescription: 'Original short',
                description: 'Original description',
                studyCredit: 15,
                location: 'Breda',
                contactId: 1,
                level: 'Bachelor',
                learningOutcomes: 'Original outcomes',
                moduleTags: ['tag1'],
                popularityScore: 0,
                estimatedDifficulty: 3,
                availableSpots: 20,
                startDate: new Date('2026-09-01'),
            };

            mockModuleService.update.mockResolvedValue(expectedModule);

            const result = await controller.update(1, dto, mockRequest);

            expect(result).toEqual(expectedModule);
            expect(mockModuleService.update).toHaveBeenCalledWith(1, dto);
        });
    });

    describe('remove', () => {
        it('should remove a module by id', async () => {
            mockModuleService.remove.mockResolvedValue(undefined);

            await controller.remove(1, mockRequest);

            expect(mockModuleService.remove).toHaveBeenCalledWith(1);
            expect(mockModuleService.remove).toHaveBeenCalledTimes(1);
        });

        it('should handle different module ids', async () => {
            mockModuleService.remove.mockResolvedValue(undefined);

            await controller.remove(42, mockRequest);

            expect(mockModuleService.remove).toHaveBeenCalledWith(42);
        });

        it('should pass through service errors on remove', async () => {
            const error = new Error('Module with ID 999 not found');
            mockModuleService.remove.mockRejectedValue(error);

            await expect(controller.remove(999, mockRequest)).rejects.toThrow('Module with ID 999 not found');
            expect(mockModuleService.remove).toHaveBeenCalledWith(999);
        });

        it('should successfully remove multiple modules sequentially', async () => {
            mockModuleService.remove.mockResolvedValue(undefined);

            await controller.remove(1, mockRequest);
            await controller.remove(2, mockRequest);
            await controller.remove(3, mockRequest);

            expect(mockModuleService.remove).toHaveBeenCalledTimes(3);
            expect(mockModuleService.remove).toHaveBeenNthCalledWith(1, 1);
            expect(mockModuleService.remove).toHaveBeenNthCalledWith(2, 2);
            expect(mockModuleService.remove).toHaveBeenNthCalledWith(3, 3);
        });
    });
});
