import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, Matches, ValidateIf } from 'class-validator';

export class UpdateStudentProfileDto {
    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @ValidateIf((obj) => obj.interests !== null && obj.interests !== undefined)
    @IsString()
    @Matches(/^(.+;)+$/, { message: 'Interests must be semicolon-separated values in format: value1;value2;value3;' })
    @MaxLength(1000, { message: 'Interests must not exceed 1000 characters' })
    interests?: string | null;

    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @ValidateIf((obj) => obj.merits !== null && obj.merits !== undefined)
    @IsString()
    @Matches(/^(.+;)+$/, { message: 'Merits must be semicolon-separated values in format: value1;value2;value3;' })
    @MaxLength(1000, { message: 'Merits must not exceed 1000 characters' })
    merits?: string | null;

    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @ValidateIf((obj) => obj.goals !== null && obj.goals !== undefined)
    @IsString()
    @Matches(/^(.+;)+$/, { message: 'Goals must be semicolon-separated values in format: value1;value2;value3;' })
    @MaxLength(1000, { message: 'Goals must not exceed 1000 characters' })
    goals?: string | null;
}