import { Transform } from 'class-transformer';
import { IsOptional, IsString, ValidateIf } from 'class-validator';
import {
    IsSemicolonSeparatedPreferences,
    INTEREST_MAX_LENGTH,
    MAX_INTERESTS_COUNT,
    MERIT_MAX_LENGTH,
    MAX_MERITS_COUNT,
    GOALS_MAX_LENGTH,
    MAX_GOALS_COUNT,
} from '../validators/preferences.validator';

export class UpdateStudentProfileDto {
    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @ValidateIf((obj) => obj.interests !== null && obj.interests !== undefined)
    @IsString()
    @IsSemicolonSeparatedPreferences(
        {
            maxItemLength: INTEREST_MAX_LENGTH,
            maxItemsCount: MAX_INTERESTS_COUNT,
            fieldName: 'Interests',
        },
    )
    interests?: string | null;

    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @ValidateIf((obj) => obj.merits !== null && obj.merits !== undefined)
    @IsString()
    @IsSemicolonSeparatedPreferences(
        {
            maxItemLength: MERIT_MAX_LENGTH,
            maxItemsCount: MAX_MERITS_COUNT,
            fieldName: 'Merits',
        },
    )
    merits?: string | null;

    @IsOptional()
    @Transform(({ value }) => value === null || value === '' ? null : String(value).trim())
    @ValidateIf((obj) => obj.goals !== null && obj.goals !== undefined)
    @IsString()
    @IsSemicolonSeparatedPreferences(
        {
            maxItemLength: GOALS_MAX_LENGTH,
            maxItemsCount: MAX_GOALS_COUNT,
            fieldName: 'Goals',
        },
    )
    goals?: string | null;
}