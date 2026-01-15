export class FastApiResponseDto {
    modules!: FastApiResponseItemDto[];
    model_version!: string;
}

export class FastApiResponseItemDto {
    id!: number;
    name!: string;
    description!: string;
    total_score!: number;
    goals!: string;
    matching_keywords!: string[];
}
