import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module } from './module.entity';
import { QueryModuleDto } from './dto/query-module.dto';
import { ModuleQueryResponseDto } from './dto/module-response.dto';

const PAGE_SIZE = 10;

@Injectable()
export class ModuleService {
    constructor(
        @InjectRepository(Module)
        private readonly moduleRepo: Repository<Module>,
    ) { }

    async findAll(query: QueryModuleDto, user: string | undefined): Promise<ModuleQueryResponseDto> {
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
                { search: `%${query.search}%` }
            );
        }

        if (query.location && query.location !== 'all') {
            queryBuilder.andWhere('module.location LIKE :location', { location: `%${query.location}%` });
        }

        if (query.level && query.level !== 'all') {
            queryBuilder.andWhere('module.level LIKE :level', { level: `%${query.level}%` });
        }

        // Apply sorting
        const sortBy = query.sortBy || 'popularity';
        switch (sortBy) {
            case 'popularity':
                queryBuilder.orderBy('module.popularity_score', 'DESC');
                break;
            case 'popularity_asc':
                queryBuilder.orderBy('module.popularity_score', 'ASC');
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
                queryBuilder.orderBy('module.popularity_score', 'DESC');
        }

        const totalCount = await queryBuilder.getCount();
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);
        let currentPage = query.page || 1;
        if (currentPage > totalPages) {
            currentPage = 1;
        }

        // Apply pagination with offset and limit
        queryBuilder
            .offset((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const results = await queryBuilder.getRawMany();

        // Remove module_ prefix from keys and convert isFavourite to boolean
        const data = results.map(result => {
            const cleaned: any = {};
            for (const key in result) {
                const cleanKey = key.startsWith('module_') ? key.replace('module_', '') : key;
                cleaned[cleanKey] = result[key];
            }
            cleaned.isFavourite = cleaned.isFavourite === true || cleaned.isFavourite === 1 || cleaned.isFavourite === '1';
            return cleaned;
        });

        return {
            page: currentPage,
            pages: totalPages,
            data,
            filters: {
                sortBy: [
                    {
                        name: "Populariteit ▼",
                        key: "popularity"
                    },
                    {
                        name: "Populariteit ▲",
                        key: "popularity_asc"
                    },
                    {
                        name: "Moeilijkheidsgraad ▲",
                        key: "difficulty"
                    },
                    {
                        name: "Moeilijkheidsgraad ▼",
                        key: "difficulty_desc"
                    },
                    {
                        name: "Naam (A-Z)",
                        key: "name"
                    },
                    {
                        name: "Naam (Z-A)",
                        key: "name_desc"
                    },
                    {
                        name: "Startdatum ▲",
                        key: "start_date"
                    },
                    {
                        name: "Startdatum ▼",
                        key: "start_date_desc"
                    }
                ],
                level: [
                    {
                        name: "NLQF5",
                        key: "NLQF5"
                    },
                    {
                        name: "NLQF6",
                        key: "NLQF6"
                    },
                    {
                        name: "Alle niveaus",
                        key: "all"
                    }
                ],
                locations: [
                    {
                        name: "Breda",
                        key: "breda"
                    },
                    {
                        name: "Tilburg",
                        key: "tilburg"
                    },
                    {
                        name: "Den Bosch",
                        key: "den bosch"
                    },
                    {
                        name: "Alle locaties",
                        key: "all"
                    }
                ]
            }
        };
    }

    async findOne(id: number): Promise<Module> {
        const module = await this.moduleRepo.findOne({ where: { id: id } });

        if (!module) {
            throw new NotFoundException(`Module with ID ${id} not found`);
        }

        return module;
    }
}

