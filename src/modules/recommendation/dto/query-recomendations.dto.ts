import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class QueryRecommendationsDto {
    @IsOptional()
    @Transform(({ value }) => value === null || value === undefined || value === '' ? undefined : String(value).trim())
    @IsString()
    @MaxLength(100)
    search?: string;

    @IsOptional()
    @Transform(({ value }) => value === null || value === undefined || value === '' ? 'all' : String(value).trim())
    @IsString()
    @MaxLength(50)
    location?: string = 'all';

    @IsOptional()
    @Transform(({ value }) => value === null || value === undefined || value === '' ? 'all' : String(value).trim())
    @IsString()
    @MaxLength(50)
    level?: string = 'all';

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    favourites?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(10000)
    page?: number;
}

