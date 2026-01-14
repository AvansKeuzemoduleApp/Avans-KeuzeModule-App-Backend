import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Module } from './module.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { QueryModuleDto } from './dto/query-module.dto';
import { ModuleQueryResponseDto, ModuleResponseItemDto } from './dto/module-response.dto';
import { ModuleDetailDto } from './dto/moduledetail-response.dto';
import { ModuleMapper } from './mappers/toModuleDetailDtoMapper';
import { defaultSortableModuleFilters } from './data/module-filters';
import { sanitizeTags, sanitizeText } from '../../sanitization/sanitize-text';
import { LoggingHandler } from '../logger/LoggingHandler';
import { ModuleLogMapper } from '../logger/helpers/module-log-mapper';

const PAGE_SIZE = 10;

@Injectable()
export class ModuleService {
    private readonly logger = new Logger(ModuleService.name);
    private contactReference:
        | { tableName: string; columnName: string }
        | null
        | undefined;

    private validateNonEmptyString(
        value: string | null | undefined,
        fieldName: string,
    ): void {
        const log = new LoggingHandler(this.logger, {
            level: 'debug',
            codeLocation: 'validateNonEmptyString'
        })
        if (typeof value !== 'string' || value.trim().length === 0) {
            log.UpdateDebug("value", value ?? undefined)
                .UpdateDebug("fieldName", fieldName).Update("message", `Field "${fieldName}" must be a non-empty string.`).Send();
            throw new BadRequestException(`Field "${fieldName}" must be a non-empty string.`);
        } else {
            log.Send();
        }
    }

    private sanitizeCreateDto(dto: CreateModuleDto): CreateModuleDto {
        const newDto = {
            ...dto,
            name: sanitizeText(dto.name),
            shortdescription: sanitizeText(dto.shortdescription),
            description: sanitizeText(dto.description),
            location: sanitizeText(dto.location),
            level: sanitizeText(dto.level),
            learningoutcomes: sanitizeText(dto.learningoutcomes),
            module_tags: sanitizeTags(dto.module_tags ?? []),
        };
        new LoggingHandler(this.logger, {
            level: 'debug',
            codeLocation: 'sanitizeCreateDto',
            moduleData: newDto
        }).Send();
        return newDto;
    }

    private sanitizeUpdateDto(dto: UpdateModuleDto): UpdateModuleDto {
        const out: UpdateModuleDto = { ...dto };

        const textFields: Array<
            keyof Pick<
                UpdateModuleDto,
                'name' | 'shortdescription' | 'description' | 'location' | 'level' | 'learningoutcomes'
            >
        > = [
                'name',
                'shortdescription',
                'description',
                'location',
                'level',
                'learningoutcomes',
            ];

        for (const key of textFields) {
            const value = out[key];
            if (typeof value === 'string') {
                out[key] = sanitizeText(value) as any;
            }
        }

        if (out.module_tags !== undefined) {
            out.module_tags = sanitizeTags(out.module_tags ?? []);
        }
        new LoggingHandler(this.logger, {
            level: 'debug',
            codeLocation: 'sanitizeUpdateDto',
            moduleData: out
        }).Send();

        return out;
    }

    constructor(
        @InjectRepository(Module)
        private readonly moduleRepo: Repository<Module>,
        private readonly dataSource: DataSource,
    ) { }

    private isSafeIdentifier(value: string): boolean {
        return /^[a-zA-Z0-9_]+$/.test(value);
    }

    async create(dto: CreateModuleDto): Promise<Module> {
        dto = this.sanitizeCreateDto(dto);

        this.validateNonEmptyString(dto.name, 'name');
        this.validateNonEmptyString(dto.shortdescription, 'shortdescription');
        this.validateNonEmptyString(dto.description, 'description');
        this.validateNonEmptyString(dto.location, 'location');
        this.validateNonEmptyString(dto.level, 'level');
        this.validateNonEmptyString(dto.learningoutcomes, 'learningoutcomes');

        const contactId = dto.contact_id ?? 1;
        const estimatedDifficulty = dto.estimated_difficulty ?? 0;

        const entity = this.moduleRepo.create({
            name: dto.name,
            shortDescription: dto.shortdescription,
            description: dto.description,
            studyCredit: dto.studycredit,
            location: dto.location,
            contactId,
            level: dto.level,
            learningOutcomes: dto.learningoutcomes,
            moduleTags: dto.module_tags,
            popularityScore: 0,
            estimatedDifficulty,
            availableSpots: dto.available_spots,
            startDate: dto.start_date,
        });

        return this.moduleRepo.save(entity);
    }

    async update(id: number, dto: UpdateModuleDto): Promise<Module> {
        const entity = await this.moduleRepo.findOne({ where: { id } });
        if (!entity) throw new NotFoundException(`Module with ID ${id} not found`);

        dto = this.sanitizeUpdateDto(dto);

        if (dto.name !== undefined) this.validateNonEmptyString(dto.name, 'name');
        if (dto.shortdescription !== undefined)
            this.validateNonEmptyString(dto.shortdescription, 'shortdescription');
        if (dto.description !== undefined)
            this.validateNonEmptyString(dto.description, 'description');
        if (dto.location !== undefined)
            this.validateNonEmptyString(dto.location, 'location');
        if (dto.level !== undefined) this.validateNonEmptyString(dto.level, 'level');
        if (dto.learningoutcomes !== undefined)
            this.validateNonEmptyString(dto.learningoutcomes, 'learningoutcomes');

        const updates: Partial<Module> = {};

        const fieldMap: Array<
            readonly [
                keyof UpdateModuleDto,
                keyof Module,
            ]
        > = [
                ['name', 'name'],
                ['shortdescription', 'shortDescription'],
                ['description', 'description'],
                ['studycredit', 'studyCredit'],
                ['location', 'location'],
                ['contact_id', 'contactId'],
                ['level', 'level'],
                ['learningoutcomes', 'learningOutcomes'],
                ['module_tags', 'moduleTags'],
                ['estimated_difficulty', 'estimatedDifficulty'],
                ['available_spots', 'availableSpots'],
                ['start_date', 'startDate'],
            ];

        for (const [dtoKey, entityKey] of fieldMap) {
            const value = dto[dtoKey];
            if (value !== undefined) {
                (updates as any)[entityKey] = value;
            }
        }

        Object.assign(entity, updates);

        return this.moduleRepo.save(entity);
    }

    async remove(id: number): Promise<void> {
        const entity = await this.moduleRepo.findOne({ where: { id } });
        if (!entity) throw new NotFoundException(`Module with ID ${id} not found`);

        await this.moduleRepo.remove(entity);
    }

    async findAll(
        query: QueryModuleDto,
        user: string | undefined,
    ): Promise<ModuleQueryResponseDto<ModuleResponseItemDto>> {
        const queryBuilder = this.moduleRepo
            .createQueryBuilder('module')
            .select('module');

        // Add isFavourite flag and join student_favourites only when user is provided
        if (user) {
            queryBuilder
                .addSelect(
                    'CASE WHEN sf.student_id IS NOT NULL THEN true ELSE false END',
                    'isFavourite',
                )
                .leftJoin(
                    'student_favourites',
                    'sf',
                    'sf.module_id = module.id AND sf.student_id = :userId',
                    { userId: user },
                );
        } else {
            queryBuilder.addSelect('false', 'isFavourite');
        }

        // Filter by favourites only if requested
        if (query.favourites && user) {
            queryBuilder.andWhere('sf.student_id IS NOT NULL');
        }

        // Filter by search term in name or description or learningoutcomes or module_tags
        if (query.search) {
            queryBuilder.andWhere(
                '(module.name LIKE :search OR module.description LIKE :search OR module.learningoutcomes LIKE :search OR module.module_tags LIKE :search)',
                { search: `%${query.search}%` },
            );
        }

        if (query.location && query.location !== 'all') {
            queryBuilder.andWhere('module.location LIKE :location', {
                location: `%${query.location}%`,
            });
        }

        if (query.level && query.level !== 'all') {
            queryBuilder.andWhere('module.level LIKE :level', {
                level: `%${query.level}%`,
            });
        }

        if (query.studyPoints && query.studyPoints !== 'all') {
            const studyPointsValue = parseInt(query.studyPoints, 10);
            queryBuilder.andWhere('module.studyCredit = :studyPoints', {
                studyPoints: studyPointsValue,
            });
        }

        // Apply sorting
        const sortBy = query.sortBy || 'id_asc';
        switch (sortBy) {
            case 'id':
                queryBuilder.orderBy('module.id', 'DESC');
                break;
            case 'id_asc':
                queryBuilder.orderBy('module.id', 'ASC');
                break;
            case 'difficulty':
                queryBuilder.orderBy('module.estimated_difficulty', 'ASC');
                break;
            case 'difficulty_desc':
                queryBuilder.orderBy('module.estimated_difficulty', 'DESC');
                break;
            case 'name':
                queryBuilder.orderBy('module.name', 'ASC');
                break;
            case 'name_desc':
                queryBuilder.orderBy('module.name', 'DESC');
                break;
            case 'start_date':
                queryBuilder.orderBy('module.start_date', 'ASC');
                break;
            case 'start_date_desc':
                queryBuilder.orderBy('module.start_date', 'DESC');
                break;
            default:
                queryBuilder.orderBy('module.id', 'ASC');
        }

        const totalCount = await queryBuilder.getCount();
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);
        let currentPage = query.page || 1;
        if (currentPage > totalPages) {
            currentPage = 1;
        }

        // Apply pagination with offset and limit
        queryBuilder.offset((currentPage - 1) * PAGE_SIZE).limit(PAGE_SIZE);

        const results = await queryBuilder.getRawMany();

        const data = results.map((result) => ModuleMapper.toResponseItemDto(result));
        const responseObject = {
            page: currentPage,
            pages: totalPages,
            data,
            filters: {
                ...defaultSortableModuleFilters,
                showFavourites: false,
            },
        };
        return responseObject;
    }

    async findOne(
        id: number,
        user: string | undefined,
    ): Promise<ModuleDetailDto> {
        const queryBuilder = this.moduleRepo
            .createQueryBuilder('module')
            .select('module');
        // Add isFavourite flag and join student_favourites only when userId is provided

        if (user) {
            queryBuilder
                .addSelect(
                    'CASE WHEN sf.student_id IS NOT NULL THEN true ELSE false END',
                    'isFavourite',
                )
                .leftJoin(
                    'student_favourites',
                    'sf',
                    'sf.module_id = module.id AND sf.student_id = :userId',
                    { userId: user },
                );
        } else {
            queryBuilder.addSelect('false', 'isFavourite');
        }

        const result = await queryBuilder
            .where('module.id = :id', { id })
            .getRawOne();

        if (!result) {
            throw new NotFoundException(`Module with ID ${id} not found`);
        }

        return ModuleMapper.toDetailDto(result);
    }
}