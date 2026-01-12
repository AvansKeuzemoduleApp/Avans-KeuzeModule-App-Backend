import { ModuleFilters } from "./module-response.dto";

export const defaultModuleFilters: ModuleFilters = {
    level: [
        {
            name: 'NLQF5',
            key: 'NLQF5',
        },
        {
            name: 'NLQF6',
            key: 'NLQF6',
        },
        {
            name: 'Alle niveaus',
            key: 'all',
        },
    ],
    locations: [
        {
            name: 'Breda',
            key: 'breda',
        },
        {
            name: 'Tilburg',
            key: 'tilburg',
        },
        {
            name: 'Den Bosch',
            key: 'den bosch',
        },
        {
            name: 'Alle locaties',
            key: 'all',
        },
    ],
    showFavourites: false
}

export const defaultSortableModuleFilters = structuredClone(defaultModuleFilters)
defaultSortableModuleFilters.sortBy = [
    {
        name: 'Populariteit ▼',
        key: 'popularity',
    },
    {
        name: 'Populariteit ▲',
        key: 'popularity_asc',
    },
    {
        name: 'Moeilijkheidsgraad ▲',
        key: 'difficulty',
    },
    {
        name: 'Moeilijkheidsgraad ▼',
        key: 'difficulty_desc',
    },
    {
        name: 'Naam (A-Z)',
        key: 'name',
    },
    {
        name: 'Naam (Z-A)',
        key: 'name_desc',
    },
    {
        name: 'Startdatum ▲',
        key: 'start_date',
    },
    {
        name: 'Startdatum ▼',
        key: 'start_date_desc',
    }
]