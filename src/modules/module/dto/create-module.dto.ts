import { ArrayMaxSize, IsArray, IsDateString, IsInt, IsString, Length, Max, Min } from 'class-validator';
import { IsNotPastDate } from './validators/is-not-past-date.validator';
import { IsNotHtml } from './validators/is-not-html.validator';

export class CreateModuleDto {
    @IsString()
    @Length(1, 120)
    @IsNotHtml()
    name!: string;

    @IsString()
    @Length(1, 280)
    @IsNotHtml()
    shortdescription!: string;

    @IsString()
    @Length(1, 5000)
    @IsNotHtml()
    description!: string;

    @IsInt()
    @Min(0)
    @Max(60)
    studycredit!: number;

    @IsString()
    @Length(1, 80)
    @IsNotHtml()
    location!: string;

    @IsInt()
    @Min(1)
    contact_id!: number;

    @IsString()
    @Length(1, 40)
    @IsNotHtml()
    level!: string;

    @IsString()
    @Length(1, 5000)
    @IsNotHtml()
    learningoutcomes!: string;

    @IsArray()
    @ArrayMaxSize(50)
    @IsNotHtml({ each: true})
    module_tags!: string[];

    @IsInt()
    @Min(0)
    @Max(10)
    estimated_difficulty!: number;

    @IsInt()
    @Min(0)
    available_spots!: number;

    @IsDateString()
    @IsNotPastDate()
    start_date!: string;
}
