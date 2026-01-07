export class FilterOption {
    name: string;
    key: string;
}

export class ModuleFilters {
    sortBy: FilterOption[];
    level: FilterOption[];
    locations: FilterOption[];
}

export class ModuleQueryResponseDto<T = unknown> {
    page: number;
    pages: number;
    data: T[];
    filters: ModuleFilters;
}
