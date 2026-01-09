export class ModuleRecommendationDto {
    id!: number;
    name!: string;
    shortDescription!: string;
    description!: string;
    learningOutcomes!: string;
    moduleTags!: string[];
    studyCredit!: number;
    location!: string;
    contactId!: number;
    level!: string;
    availableSpots!: number;
    startDate!: string;
}

export class RecommendationResponseDto {
    cache!: {
        id: string;
        userId: string;
        modelVersion: string;
        createdAt: Date;
        expiresAt?: Date;
    };
    modules!: ModuleRecommendationDto[];
}
