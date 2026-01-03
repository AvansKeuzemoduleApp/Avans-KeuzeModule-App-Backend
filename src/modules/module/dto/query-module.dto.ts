import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum SortOption {
    POPULARITY = 'popularity',
    MATCH = 'match',
    DIFFICULTY = 'difficulty',
    NAME = 'name',
    START_DATE = 'start_date',
}

export class QueryModuleDto {
    @IsOptional()
    @Transform(({ value }) => value === null || value === undefined || value === '' ? undefined : String(value).trim())
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => value === null || value === undefined || value === '' ? 'all' : String(value).trim())
    @IsString()
    location?: string = 'all';

    @IsOptional()
    @Transform(({ value }) => value === null || value === undefined || value === '' ? 'all' : String(value).trim())
    @IsString()
    level?: string = 'all';

    @IsOptional()
    @Transform(({ value }) => value === null || value === undefined || value === '' ? 'popularity' : String(value).trim())
    @IsEnum(SortOption, { message: 'Sort must be one of: popularity, match, difficulty, name, start_date' })
    sort?: SortOption = SortOption.POPULARITY;
}

