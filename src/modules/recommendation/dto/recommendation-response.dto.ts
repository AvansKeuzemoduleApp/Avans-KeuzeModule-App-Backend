import { ModuleFilters } from "../../module/dto/module-response.dto";

export class RecommendationResponseDto<T = unknown> {
    modelVersion: string;
    createdAt: Date;
    page: number;
    pages: number;
    data: T[];
    filters: ModuleFilters;
}

export class RecommendedResponseItemDto {
    id: number;
    name: string;
    shortdescription: string;
    description: string;
    studycredit: number;
    location: string;
    contact_id: number;
    level: string;
    learningoutcomes: string;
    module_tags: string[];
    popularity_score: number;
    estimated_difficulty: number;
    available_spots: number;
    start_date: string;
    isFavourite: boolean;
    explanation: string;
}