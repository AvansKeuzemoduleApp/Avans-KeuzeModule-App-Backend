import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module } from './module.entity';
import { QueryModuleDto } from './dto/query-module.dto';

const PAGE_SIZE = 10;

@Injectable()
export class ModuleService {
    constructor(
        @InjectRepository(Module)
        private readonly moduleRepo: Repository<Module>,
    ) { }

    async findAll(query: QueryModuleDto, user: string | undefined): Promise<any> {
        const queryBuilder = this.moduleRepo
            .createQueryBuilder('module')
            .select([
                'module.*',
                user ? 'CASE WHEN sf.student_id IS NOT NULL THEN true ELSE false END AS "isFavourite"' : 'false AS "isFavourite"'
            ]);

        // Left join with student_favourites if user is provided
        if (user) {
            queryBuilder.leftJoin(
                'student_favourites',
                'sf',
                'sf.module_id = module.id AND sf.student_id = :userId',
                { userId: user }
            );
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

        const totalCount = await queryBuilder.getCount();
        const totalPages = Math.ceil(totalCount / PAGE_SIZE);
        const currentPage = query.page || 1;

        // Apply pagination with offset and limit
        queryBuilder
            .offset((currentPage - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE);

        const results = await queryBuilder.getRawMany();

        // Convert isFavourite to boolean
        const data = results.map(result => ({
            ...result,
            isFavourite: result.isFavourite === true || result.isFavourite === 1 || result.isFavourite === '1'
        }));

        return {
            page: currentPage,
            pages: totalPages,
            data
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

