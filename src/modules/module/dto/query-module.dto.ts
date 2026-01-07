import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

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
    @Transform(({ value }) => value === null || value === undefined || value === '' ? 'popularity' : String(value).trim())
    @IsIn(['popularity', 'popularity_asc', 'difficulty', 'difficulty_desc', 'name', 'name_desc', 'start_date', 'start_date_desc'])
    @IsString()
    sortBy?: string = 'popularity';

    @IsOptional()
    @Transform(({ value }) => value === null || value === undefined || value === '' ? 'all' : String(value).trim())
    @IsString()
    level?: string = 'all';

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    favourites?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;
}

