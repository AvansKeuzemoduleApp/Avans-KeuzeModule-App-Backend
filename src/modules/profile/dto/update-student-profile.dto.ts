import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateStudentProfileDto {
    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @IsString()
    @MaxLength(255, { message: 'Interests must not exceed 255 characters' })
    interests?: string | null;

    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @IsString()
    @MaxLength(255, { message: 'Merits must not exceed 255 characters' })
    merits?: string | null;

    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @IsString()
    @MaxLength(255, { message: 'Goals must not exceed 255 characters' })
    goals?: string | null;

    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @IsString()
    @MaxLength(255, { message: 'Preferred location must not exceed 255 characters' })
    preferred_location?: string | null;

    @IsOptional()
    @IsInt({ message: 'Preferred study credits must be an integer' })
    @Min(1, { message: 'Preferred study credits must be a positive integer' })
    preferred_study_credits?: number | null;
}
