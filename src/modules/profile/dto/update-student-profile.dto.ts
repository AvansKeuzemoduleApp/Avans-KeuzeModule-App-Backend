import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStudentProfileDto {
    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @IsString()
    @MaxLength(1000, { message: 'Interests must not exceed 1000 characters' })
    interests?: string | null;

    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @IsString()
    @MaxLength(1000, { message: 'Merits must not exceed 1000 characters' })
    merits?: string | null;

    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @IsString()
    @MaxLength(1000, { message: 'Goals must not exceed 1000 characters' })
    goals?: string | null;
}