import { Test, TestingModule } from '@nestjs/testing';
import { ModuleController } from '../module.controller';
import { ModuleService } from '../module.service';
import { QueryModuleDto } from '../dto/query-module.dto';

describe('ModuleController', () => {
    let controller: ModuleController;
    let service: ModuleService;

    const mockModuleService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ModuleController],
            providers: [
                {
                    provide: ModuleService,
                    useValue: mockModuleService,
                },
            ],
        }).compile();

        controller = module.get<ModuleController>(ModuleController);
        service = module.get<ModuleService>(ModuleService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return paginated modules', async () => {
            const mockRequest = {
                user: { sub: 'user123' },
            } as any;

            const query: QueryModuleDto = {};

            const expectedResult = {
                page: 1,
                pages: 1,
                data: [
                    {
                        id: 1,
                        name: 'Test Module',
                        shortdescription: 'Short desc',
                        description: 'Long description',
                        studycredit: 15,
                        location: 'Breda',
                        contact_id: 1,
                        level: 'Bachelor',
                        learningoutcomes: 'Learn things',
                        module_tags: ['tag1'],
                        popularity_score: 0,
                        estimated_difficulty: 3,
                        available_spots: 20,
                        start_date: '2026-09-01',
                        isFavourite: false,
                    },
                ],
                filters: {
                    showFavourites: false,
                },
            };

            mockModuleService.findAll.mockResolvedValue(expectedResult);

            const result = await controller.findAll(mockRequest, query);

            expect(result).toEqual(expectedResult);
            expect(mockModuleService.findAll).toHaveBeenCalledWith(query, 'user123');
            expect(mockModuleService.findAll).toHaveBeenCalledTimes(1);
        });

        it('should pass query parameters to service', async () => {
            const mockRequest = {
                user: { sub: 'user123' },
            } as any;

            const query: QueryModuleDto = {
                search: 'test',
                location: 'Breda',
                level: 'Bachelor',
                sortBy: 'name',
                page: 2,
            };

            const expectedResult = {
                page: 2,
                pages: 3,
                data: [],
                filters: {},
            };

            mockModuleService.findAll.mockResolvedValue(expectedResult);

            await controller.findAll(mockRequest, query);

            expect(mockModuleService.findAll).toHaveBeenCalledWith(query, 'user123');
        });

        it('should handle favourites filter', async () => {
            const mockRequest = {
                user: { sub: 'user123' },
            } as any;

            const query: QueryModuleDto = {
                favourites: true,
            };

            const expectedResult = {
                page: 1,
                pages: 1,
                data: [],
                filters: {},
            };

            mockModuleService.findAll.mockResolvedValue(expectedResult);

            await controller.findAll(mockRequest, query);

            expect(mockModuleService.findAll).toHaveBeenCalledWith(query, 'user123');
        });

        it('should extract user ID from request', async () => {
            const mockRequest = {
                user: { sub: 'different-user-id' },
            } as any;

            const query: QueryModuleDto = {};

            mockModuleService.findAll.mockResolvedValue({
                page: 1,
                pages: 1,
                data: [],
                filters: {},
            });

            await controller.findAll(mockRequest, query);

            expect(mockModuleService.findAll).toHaveBeenCalledWith(query, 'different-user-id');
        });
    });

    describe('findOne', () => {
        it('should return a single module by id', async () => {
            const mockRequest = {
                user: { sub: 'user123' },
            } as any;

            const expectedModule = {
                id: 1,
                name: 'Test Module',
                shortdescription: 'Short desc',
                description: 'Long description',
                studycredit: 15,
                location: 'Breda',
                contact_id: 1,
                level: 'Bachelor',
                learningoutcomes: 'Learn things',
                module_tags: ['tag1'],
                popularity_score: 0,
                estimated_difficulty: 3,
                available_spots: 20,
                start_date: '2026-09-01',
                isFavourite: true,
            };

            mockModuleService.findOne.mockResolvedValue(expectedModule);

            const result = await controller.findOne(1, mockRequest);

            expect(result).toEqual(expectedModule);
            expect(mockModuleService.findOne).toHaveBeenCalledWith(1, 'user123');
            expect(mockModuleService.findOne).toHaveBeenCalledTimes(1);
        });

        it('should work for unauthenticated users (public access)', async () => {
            const mockRequest = {
                user: undefined,
            } as any;

            const expectedModule = {
                id: 1,
                name: 'Test Module',
                shortdescription: 'Short desc',
                description: 'Long description',
                studycredit: 15,
                location: 'Breda',
                contact_id: 1,
                level: 'Bachelor',
                learningoutcomes: 'Learn things',
                module_tags: ['tag1'],
                popularity_score: 0,
                estimated_difficulty: 3,
                available_spots: 20,
                start_date: '2026-09-01',
                isFavourite: false,
            };

            mockModuleService.findOne.mockResolvedValue(expectedModule);

            const result = await controller.findOne(1, mockRequest);

            expect(result).toEqual(expectedModule);
            expect(mockModuleService.findOne).toHaveBeenCalledWith(1, undefined);
        });

        it('should handle different module ids', async () => {
            const mockRequest = {
                user: { sub: 'user123' },
            } as any;

            const expectedModule = {
                id: 42,
                name: 'Another Module',
                shortdescription: 'Short',
                description: 'Desc',
                studycredit: 30,
                location: 'Tilburg',
                contact_id: 2,
                level: 'Master',
                learningoutcomes: 'Advanced things',
                module_tags: ['advanced'],
                popularity_score: 10,
                estimated_difficulty: 5,
                available_spots: 15,
                start_date: '2026-10-01',
                isFavourite: false,
            };

            mockModuleService.findOne.mockResolvedValue(expectedModule);

            const result = await controller.findOne(42, mockRequest);

            expect(result.id).toBe(42);
            expect(mockModuleService.findOne).toHaveBeenCalledWith(42, 'user123');
        });

        it('should pass through service errors', async () => {
            const mockRequest = {
                user: { sub: 'user123' },
            } as any;

            const error = new Error('Module not found');
            mockModuleService.findOne.mockRejectedValue(error);

            await expect(controller.findOne(999, mockRequest)).rejects.toThrow('Module not found');
            expect(mockModuleService.findOne).toHaveBeenCalledWith(999, 'user123');
        });
    });
});
