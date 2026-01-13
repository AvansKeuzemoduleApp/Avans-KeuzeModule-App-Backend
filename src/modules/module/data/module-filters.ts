import { ModuleFilters } from "../dto/module-response.dto";

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
    studyPoints: [
        {
            name: '15 Studie Punten',
            key: '15',
        },
        {
            name: '30 Studie Punten',
            key: '30',
        },
        {
            name: 'Alle Aantallen',
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
        name: 'Toevoegdatum ▼',
        key: 'id',
    },
    {
        name: 'Toevoegdatum ▲',
        key: 'id_asc',
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