import { ArrayMaxSize, IsArray, IsDateString, IsInt, IsString, Length, Max, Min } from 'class-validator';

export class CreateModuleDto {
    @IsString()
    @Length(1, 120)
    name!: string;

    @IsString()
    @Length(1, 280)
    shortdescription!: string;

    @IsString()
    @Length(1, 5000)
    description!: string;

    @IsInt()
    @Min(0)
    @Max(60)
    studycredit!: number;

    @IsString()
    @Length(1, 80)
    location!: string;

    @IsInt()
    @Min(1)
    contact_id!: number;

    @IsString()
    @Length(1, 40)
    level!: string;

    @IsString()
    @Length(1, 5000)
    learningoutcomes!: string;

    @IsArray()
    @ArrayMaxSize(50)
    module_tags!: string[];

    @IsInt()
    @Min(0)
    @Max(10)
    estimated_difficulty!: number;

    @IsInt()
    @Min(0)
    available_spots!: number;

    @IsDateString()
    start_date!: string;
}
