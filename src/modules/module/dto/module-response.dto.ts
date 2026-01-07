export class FilterOption {
    name: string;
    key: string;
}

export class ModuleFilters {
    sortBy: FilterOption[];
    level: FilterOption[];
    locations: FilterOption[];
}

export class ModuleQueryResponseDto {
    page: number;
    pages: number;
    data: any[];
    filters: ModuleFilters;
}
