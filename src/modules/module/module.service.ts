import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module } from './module.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { QueryModuleDto } from './dto/query-module.dto';
import { ModuleQueryResponseDto } from './dto/module-response.dto';
import { ModuleDetailDto } from './dto/moduledetail-response.dto';
import { ModuleMapper } from './mappers/toModuleDetailDtoMapper';

const PAGE_SIZE = 10;

@Injectable()
export class ModuleService {
  constructor(
    @InjectRepository(Module)
    private readonly moduleRepo: Repository<Module>,
  ) {}

  async create(dto: CreateModuleDto): Promise<Module> {
    const entity = this.moduleRepo.create({
      name: dto.name,
      shortDescription: dto.shortdescription,
      description: dto.description,
      studyCredit: dto.studycredit,
      location: dto.location,
      contactId: dto.contact_id,
      level: dto.level,
      learningOutcomes: dto.learningoutcomes,
      moduleTags: dto.module_tags,
      popularityScore: 0,
      estimatedDifficulty: dto.estimated_difficulty,
      availableSpots: dto.available_spots,
      startDate: dto.start_date,
    });

    return this.moduleRepo.save(entity);
  }

  async update(id: number, dto: UpdateModuleDto): Promise<Module> {
    const entity = await this.moduleRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Module with ID ${id} not found`);

    Object.assign(entity, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.shortdescription !== undefined
        ? { shortDescription: dto.shortdescription }
        : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.studycredit !== undefined ? { studyCredit: dto.studycredit } : {}),
      ...(dto.location !== undefined ? { location: dto.location } : {}),
      ...(dto.contact_id !== undefined ? { contactId: dto.contact_id } : {}),
      ...(dto.level !== undefined ? { level: dto.level } : {}),
      ...(dto.learningoutcomes !== undefined
        ? { learningOutcomes: dto.learningoutcomes }
        : {}),
      ...(dto.module_tags !== undefined ? { moduleTags: dto.module_tags } : {}),
      ...(dto.estimated_difficulty !== undefined
        ? { estimatedDifficulty: dto.estimated_difficulty }
        : {}),
      ...(dto.available_spots !== undefined
        ? { availableSpots: dto.available_spots }
        : {}),
      ...(dto.start_date !== undefined ? { startDate: dto.start_date } : {}),
    });

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
  ): Promise<ModuleQueryResponseDto> {
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
    queryBuilder.offset((currentPage - 1) * PAGE_SIZE).limit(PAGE_SIZE);

    const results = await queryBuilder.getRawMany();

    // Remove module_ prefix from keys and convert isFavourite to boolean
    const data = results.map((result): Record<string, unknown> => {
      const cleaned: Record<string, unknown> = {};
      for (const key in result) {
        const cleanKey = key.startsWith('module_')
          ? key.replace('module_', '')
          : key;
        cleaned[cleanKey] = result[key];
      }
      const isFavouriteValue = cleaned['isFavourite'];
      const isFavourite =
        isFavouriteValue === true ||
        isFavouriteValue === 1 ||
        isFavouriteValue === '1';
      cleaned['isFavourite'] = isFavourite;
      return cleaned;
    });

    return {
      page: currentPage,
      pages: totalPages,
      data,
      filters: {
        sortBy: [
          {
            name: 'Populariteit ▼',
            key: 'popularity',
          },
          {
            name: 'Populariteit ▲',
            key: 'popularity_asc',
          },
          {
            name: 'Moeilijkheidsgraad ▲',
            key: 'difficulty',
          },
          {
            name: 'Moeilijkheidsgraad ▼',
            key: 'difficulty_desc',
          },
          {
            name: 'Naam (A-Z)',
            key: 'name',
          },
          {
            name: 'Naam (Z-A)',
            key: 'name_desc',
          },
          {
            name: 'Startdatum ▲',
            key: 'start_date',
          },
          {
            name: 'Startdatum ▼',
            key: 'start_date_desc',
          },
        ],
        level: [
          {
            name: 'NLQF5',
            key: 'NLQF5',
          },
          {
            name: 'NLQF6',
            key: 'NLQF6',
          },
          {
            name: 'Alle niveaus',
            key: 'all',
          },
        ],
        locations: [
          {
            name: 'Breda',
            key: 'breda',
          },
          {
            name: 'Tilburg',
            key: 'tilburg',
          },
          {
            name: 'Den Bosch',
            key: 'den bosch',
          },
          {
            name: 'Alle locaties',
            key: 'all',
          },
        ],
      },
    };
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
