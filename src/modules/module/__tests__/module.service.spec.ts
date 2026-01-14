import { ModuleService } from '../module.service';

describe('ModuleService', () => {
    const makeService = (overrides?: Partial<{
        moduleRepo: any;
        dataSource: any;
    }>) => {
        const moduleRepo = overrides?.moduleRepo ?? {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
        };

        const dataSource = overrides?.dataSource ?? {
            query: jest.fn(),
        };

        const service = new ModuleService(moduleRepo, dataSource);

        return { service, moduleRepo, dataSource };
    };

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('create', () => {
        it('should create a module successfully with valid data', async () => {
            const { service, moduleRepo, dataSource } = makeService();

            const dto = {
                name: 'Test Module',
                shortdescription: 'Short desc',
                description: 'Long description',
                studycredit: 15,
                location: 'Breda',
                contact_id: 1,
                level: 'Bachelor',
                learningoutcomes: 'Learn things',
                module_tags: ['tag1', 'tag2'],
                estimated_difficulty: 3,
                available_spots: 20,
                start_date: '2026-09-01',
            };

            const createdEntity = { id: 1, ...dto };
            moduleRepo.create.mockReturnValue(createdEntity);
            moduleRepo.save.mockResolvedValue(createdEntity);

            const result = await service.create(dto);

            expect(result).toEqual(createdEntity);
            expect(moduleRepo.create).toHaveBeenCalled();
            expect(moduleRepo.save).toHaveBeenCalledWith(createdEntity);
        });

        it('should throw BadRequestException when name is empty', async () => {
            const { service } = makeService();

            const dto = {
                name: '   ',
                shortdescription: 'Short desc',
                description: 'Long description',
                studycredit: 15,
                location: 'Breda',
                contact_id: 1,
                level: 'Bachelor',
                learningoutcomes: 'Learn things',
                module_tags: ['tag1'],
                estimated_difficulty: 3,
                available_spots: 20,
                start_date: '2026-09-01',
            };

            await expect(service.create(dto)).rejects.toThrow('Field "name" must be a non-empty string.');
        });

        it('should not validate contact_id existence (accept any contact_id)', async () => {
            const { service, moduleRepo } = makeService();

            const dto = {
                name: 'Test Module',
                shortdescription: 'Short desc',
                description: 'Long description',
                studycredit: 15,
                location: 'Breda',
                contact_id: 999,
                level: 'Bachelor',
                learningoutcomes: 'Learn things',
                module_tags: ['tag1'],
                estimated_difficulty: 3,
                available_spots: 20,
                start_date: '2026-09-01',
            };

            const createdEntity = { id: 1 };
            moduleRepo.create.mockReturnValue(createdEntity);
            moduleRepo.save.mockResolvedValue(createdEntity);

            await expect(service.create(dto)).resolves.toEqual(createdEntity);
        });

        it('should call sanitize functions on text fields', async () => {
            const { service, moduleRepo, dataSource } = makeService();

            const dto = {
                name: '  Test Module  \r\n',
                shortdescription: '  Short desc  ',
                description: '  Long description  ',
                studycredit: 15,
                location: 'Breda',
                contact_id: 1,
                level: 'Bachelor',
                learningoutcomes: 'Learn things',
                module_tags: ['tag1', '  tag2  ', 'tag1'], // duplicates and whitespace
                estimated_difficulty: 3,
                available_spots: 20,
                start_date: '2026-09-01',
            };

            const createdEntity = { id: 1 };
            moduleRepo.create.mockReturnValue(createdEntity);
            moduleRepo.save.mockResolvedValue(createdEntity);

            await service.create(dto);

            // Verify that sanitization was applied (trims whitespace)
            expect(moduleRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Test Module',
                    shortDescription: 'Short desc',
                    description: 'Long description',
                }),
            );
        });
    });

    describe('update', () => {
        it('should update a module successfully', async () => {
            const { service, moduleRepo, dataSource } = makeService();

            const existingModule = {
                id: 1,
                name: 'Old Name',
                shortDescription: 'Old short',
                description: 'Old desc',
                studyCredit: 15,
                location: 'Breda',
                contactId: 1,
                level: 'Bachelor',
                learningOutcomes: 'Old outcomes',
                moduleTags: ['old'],
                popularityScore: 0,
                estimatedDifficulty: 3,
                availableSpots: 20,
                startDate: new Date('2026-09-01'),
            };

            moduleRepo.findOne.mockResolvedValue(existingModule);

            // Mock contact reference resolution
            dataSource.query.mockResolvedValueOnce([{ tableName: 'contacts', columnName: 'id' }]);
            // Mock contact validation
            dataSource.query.mockResolvedValueOnce([{ one: 1 }]);

            const updatedModule = { ...existingModule, name: 'New Name' };
            moduleRepo.save.mockResolvedValue(updatedModule);

            const dto = {
                name: 'New Name',
                contact_id: 1,
            };

            const result = await service.update(1, dto);

            expect(moduleRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(result.name).toBe('New Name');
        });

        it('should throw NotFoundException when module does not exist', async () => {
            const { service, moduleRepo } = makeService();

            moduleRepo.findOne.mockResolvedValue(null);

            const dto = { name: 'New Name' };

            await expect(service.update(999, dto)).rejects.toThrow('Module with ID 999 not found');
        });

        it('should validate empty strings in update', async () => {
            const { service, moduleRepo } = makeService();

            const existingModule = {
                id: 1,
                name: 'Old Name',
            };

            moduleRepo.findOne.mockResolvedValue(existingModule);

            const dto = { name: '   ' };

            await expect(service.update(1, dto)).rejects.toThrow('Field "name" must be a non-empty string.');
        });

        it('should only update provided fields', async () => {
            const { service, moduleRepo } = makeService();

            const existingModule = {
                id: 1,
                name: 'Old Name',
                shortDescription: 'Old short',
                description: 'Old desc',
                studyCredit: 15,
                location: 'Breda',
                contactId: 1,
                level: 'Bachelor',
                learningOutcomes: 'Old outcomes',
                moduleTags: ['old'],
                popularityScore: 0,
                estimatedDifficulty: 3,
                availableSpots: 20,
                startDate: new Date('2026-09-01'),
            };

            moduleRepo.findOne.mockResolvedValue(existingModule);
            moduleRepo.save.mockResolvedValue(existingModule);

            const dto = {
                name: 'New Name',
            };

            await service.update(1, dto);

            expect(moduleRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'New Name',
                    shortDescription: 'Old short', // unchanged
                    description: 'Old desc', // unchanged
                }),
            );
        });
    });

    describe('remove', () => {
        it('should remove a module successfully', async () => {
            const { service, moduleRepo } = makeService();

            const existingModule = { id: 1, name: 'Test Module' };
            moduleRepo.findOne.mockResolvedValue(existingModule);
            moduleRepo.remove.mockResolvedValue(existingModule);

            await service.remove(1);

            expect(moduleRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(moduleRepo.remove).toHaveBeenCalledWith(existingModule);
        });

        it('should throw NotFoundException when module does not exist', async () => {
            const { service, moduleRepo } = makeService();

            moduleRepo.findOne.mockResolvedValue(null);

            await expect(service.remove(999)).rejects.toThrow('Module with ID 999 not found');
        });
    });

    describe('findAll', () => {
        const createMockQueryBuilder = (modules: any[] = []) => {
            const queryBuilder = {
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                offset: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(modules.length),
                getRawMany: jest.fn().mockResolvedValue(modules),
            };
            return queryBuilder;
        };

        it('should return paginated modules', async () => {
            const mockModules = [
                {
                    module_id: 1,
                    module_name: 'Module 1',
                    module_shortdescription: 'Short 1',
                    module_description: 'Desc 1',
                    module_studycredit: 15,
                    module_location: 'Breda',
                    module_contact_id: 1,
                    module_level: 'Bachelor',
                    module_learningoutcomes: 'Outcomes 1',
                    module_module_tags: JSON.stringify(['tag1']),
                    module_popularity_score: 0,
                    module_estimated_difficulty: 3,
                    module_available_spots: 20,
                    module_start_date: '2026-09-01',
                    isFavourite: false,
                },
            ];

            const queryBuilder = createMockQueryBuilder(mockModules);
            const { service, moduleRepo } = makeService();

            moduleRepo.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.findAll({}, 'user123');

            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('pages');
            expect(result).toHaveProperty('data');
            expect(result.data).toHaveLength(1);
            expect(queryBuilder.leftJoin).toHaveBeenCalled();
        });

        it('should filter by search term', async () => {
            const queryBuilder = createMockQueryBuilder([]);
            const { service, moduleRepo } = makeService();

            moduleRepo.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.findAll({ search: 'test' }, 'user123');

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('module.name LIKE :search'),
                { search: '%test%' },
            );
        });

        it('should filter by location', async () => {
            const queryBuilder = createMockQueryBuilder([]);
            const { service, moduleRepo } = makeService();

            moduleRepo.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.findAll({ location: 'Breda' }, 'user123');

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                'module.location LIKE :location',
                { location: '%Breda%' },
            );
        });

        it('should filter by level', async () => {
            const queryBuilder = createMockQueryBuilder([]);
            const { service, moduleRepo } = makeService();

            moduleRepo.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.findAll({ level: 'Bachelor' }, 'user123');

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                'module.level LIKE :level',
                { level: '%Bachelor%' },
            );
        });

        it('should filter by study points', async () => {
            const queryBuilder = createMockQueryBuilder([]);
            const { service, moduleRepo } = makeService();

            moduleRepo.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.findAll({ studyPoints: '15' }, 'user123');

            expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                'module.studyCredit = :studyPoints',
                { studyPoints: 15 },
            );
        });

        it('should filter by favourites when user is provided', async () => {
            const queryBuilder = createMockQueryBuilder([]);
            const { service, moduleRepo } = makeService();

            moduleRepo.createQueryBuilder.mockReturnValue(queryBuilder);

            await service.findAll({ favourites: true }, 'user123');

            expect(queryBuilder.andWhere).toHaveBeenCalledWith('sf.student_id IS NOT NULL');
        });

        it('should apply sorting by different fields', async () => {
            const queryBuilder = createMockQueryBuilder([]);
            const { service, moduleRepo } = makeService();

            moduleRepo.createQueryBuilder.mockReturnValue(queryBuilder);

            // Test name sorting
            await service.findAll({ sortBy: 'name' }, 'user123');
            expect(queryBuilder.orderBy).toHaveBeenCalledWith('module.name', 'ASC');

            // Test difficulty sorting
            await service.findAll({ sortBy: 'difficulty' }, 'user123');
            expect(queryBuilder.orderBy).toHaveBeenCalledWith('module.estimated_difficulty', 'ASC');
        });

        it('should work without user (public access)', async () => {
            const mockModules = [
                {
                    module_id: 1,
                    module_name: 'Module 1',
                    module_shortdescription: 'Short 1',
                    module_description: 'Desc 1',
                    module_studycredit: 15,
                    module_location: 'Breda',
                    module_contact_id: 1,
                    module_level: 'Bachelor',
                    module_learningoutcomes: 'Outcomes 1',
                    module_module_tags: JSON.stringify(['tag1']),
                    module_popularity_score: 0,
                    module_estimated_difficulty: 3,
                    module_available_spots: 20,
                    module_start_date: '2026-09-01',
                    isFavourite: false,
                },
            ];

            const queryBuilder = createMockQueryBuilder(mockModules);
            const { service, moduleRepo } = makeService();

            moduleRepo.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.findAll({}, undefined);

            expect(result.data).toHaveLength(1);
            expect(queryBuilder.leftJoin).not.toHaveBeenCalled();
            expect(queryBuilder.addSelect).toHaveBeenCalledWith('false', 'isFavourite');
        });

        it('should reset to page 1 when requested page exceeds total pages', async () => {
            const queryBuilder = createMockQueryBuilder([]);
            const { service, moduleRepo } = makeService();

            moduleRepo.createQueryBuilder.mockReturnValue(queryBuilder);
            queryBuilder.getCount.mockResolvedValue(5); // Only 1 page with PAGE_SIZE=10

            const result = await service.findAll({ page: 5 }, 'user123');

            expect(result.page).toBe(1);
        });
    });

    describe('findOne', () => {
        const createMockQueryBuilder = (module: any = null) => {
            const queryBuilder = {
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue(module),
            };
            return queryBuilder;
        };

        it('should return a module by id', async () => {
            const mockModule = {
                module_id: 1,
                module_name: 'Module 1',
                module_shortdescription: 'Short 1',
                module_description: 'Desc 1',
                module_studycredit: 15,
                module_location: 'Breda',
                module_contact_id: 1,
                module_level: 'Bachelor',
                module_learningoutcomes: 'Outcomes 1',
                module_module_tags: JSON.stringify(['tag1']),
                module_popularity_score: 0,
                module_estimated_difficulty: 3,
                module_available_spots: 20,
                module_start_date: '2026-09-01',
                isFavourite: true,
            };

            const queryBuilder = createMockQueryBuilder(mockModule);
            const { service, moduleRepo } = makeService();

            moduleRepo.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.findOne(1, 'user123');

            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.name).toBe('Module 1');
            expect(result.isFavourite).toBe(true);
        });

        it('should throw NotFoundException when module does not exist', async () => {
            const queryBuilder = createMockQueryBuilder(null);
            const { service, moduleRepo } = makeService();

            moduleRepo.createQueryBuilder.mockReturnValue(queryBuilder);

            await expect(service.findOne(999, 'user123')).rejects.toThrow('Module with ID 999 not found');
        });

        it('should work without user (public access)', async () => {
            const mockModule = {
                module_id: 1,
                module_name: 'Module 1',
                module_shortdescription: 'Short 1',
                module_description: 'Desc 1',
                module_studycredit: 15,
                module_location: 'Breda',
                module_contact_id: 1,
                module_level: 'Bachelor',
                module_learningoutcomes: 'Outcomes 1',
                module_module_tags: JSON.stringify(['tag1']),
                module_popularity_score: 0,
                module_estimated_difficulty: 3,
                module_available_spots: 20,
                module_start_date: '2026-09-01',
                isFavourite: false,
            };

            const queryBuilder = createMockQueryBuilder(mockModule);
            const { service, moduleRepo } = makeService();

            moduleRepo.createQueryBuilder.mockReturnValue(queryBuilder);

            const result = await service.findOne(1, undefined);

            expect(result).toBeDefined();
            expect(result.isFavourite).toBe(false);
        });
    });

    describe('contact reference resolution', () => {
        it('should cache contact reference after first resolution', async () => {
            const { dataSource } = makeService();

            // First query resolves the contact reference
            dataSource.query
                .mockResolvedValueOnce([{ tableName: 'contacts', columnName: 'id' }])
                .mockResolvedValueOnce([{ one: 1 }]); // Contact exists

            const dto = {
                name: 'Test Module',
                shortdescription: 'Short desc',
                description: 'Long description',
                studycredit: 15,
                location: 'Breda',
                contact_id: 1,
                level: 'Bachelor',
                learningoutcomes: 'Learn things',
                module_tags: ['tag1'],
                estimated_difficulty: 3,
                available_spots: 20,
                start_date: '2026-09-01',
            };

            const { moduleRepo } = makeService({ dataSource });
            moduleRepo.create.mockReturnValue({ id: 1 });
            moduleRepo.save.mockResolvedValue({ id: 1 });

            const service2 = new ModuleService(moduleRepo, dataSource);

            // Mock for first create
            dataSource.query.mockResolvedValueOnce([{ tableName: 'contacts', columnName: 'id' }]);
            dataSource.query.mockResolvedValueOnce([{ one: 1 }]);

            await service2.create(dto);

            // Mock for second create - should use cached reference
            dataSource.query.mockResolvedValueOnce([{ one: 1 }]);

            await service2.create(dto);

            // Should have queried for reference only once (first call)
            expect(dataSource.query).toHaveBeenCalledTimes(3); // 1 for ref resolution + 2 for contact validation
        });
    });
});
