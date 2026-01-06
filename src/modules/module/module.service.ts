import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module } from './module.entity';
import { QueryModuleDto } from './dto/query-module.dto';

@Injectable()
export class ModuleService {
    constructor(
        @InjectRepository(Module)
        private readonly moduleRepo: Repository<Module>,
    ) { }

    async findAll(query: QueryModuleDto, user: string | undefined): Promise<any[]> {
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

        // Filter by search term in name or description
        if (query.search) {
            queryBuilder.andWhere(
                '(module.name LIKE :search OR module.description LIKE :search OR module.learningoutcomes LIKE :search OR module.module_tags LIKE :search)',
                { search: `%${query.search}%` }
            );
        }

        // Filter by location if not 'all'
        if (query.location && query.location !== 'all') {
            queryBuilder.andWhere('module.location LIKE :location', { location: `%${query.location}%` });
        }

        // Filter by level if not 'all'
        if (query.level && query.level !== 'all') {
            queryBuilder.andWhere('module.level LIKE :level', { level: `%${query.level}%` });
        }

        // Apply pagination if page is provided
        if (query.page) {
            const pageSize = 10; // You can make this configurable
            queryBuilder.skip((query.page - 1) * pageSize).take(pageSize);
        }

        const results = await queryBuilder.getRawMany();

        // Convert isFavourite to boolean
        return results.map(result => ({
            ...result,
            isFavourite: result.isFavourite === true || result.isFavourite === 1 || result.isFavourite === '1'
        }));
    }

    async findOne(id: number): Promise<Module> {
        const module = await this.moduleRepo.findOne({ where: { id: id } });

        if (!module) {
            throw new NotFoundException(`Module with ID ${id} not found`);
        }

        return module;
    }
}

