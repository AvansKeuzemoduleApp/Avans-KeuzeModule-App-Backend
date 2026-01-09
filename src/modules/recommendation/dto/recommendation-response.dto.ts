import { ModuleFilters } from "../../module/dto/module-response.dto";

export class RecommendationResponseDto<T = unknown> {
    modelVersion: string;
    createdAt: Date;
    page: number;
    pages: number;
    data: T[];
    filters: ModuleFilters;
}
