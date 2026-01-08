import { ModuleDetailDto } from '../dto/ModuleDetailDto';

export class ModuleMapper {
  static toDetailDto(raw: any): ModuleDetailDto {
    const tagsRaw = raw.module_module_tags;
    const moduleTags = Array.isArray(tagsRaw)
      ? tagsRaw
      : typeof tagsRaw === 'string'
        ? JSON.parse(tagsRaw)
        : [];

    const startDateRaw = raw.module_start_date;
    const startDate =
      startDateRaw instanceof Date
        ? startDateRaw.toISOString().slice(0, 10)
        : typeof startDateRaw === 'string'
          ? startDateRaw.slice(0, 10)
          : String(startDateRaw).slice(0, 10);

    return {
      id: raw.module_id,
      name: raw.module_name,
      shortDescription: raw.module_shortdescription,
      description: raw.module_description,
      studyCredit: raw.module_studycredit,
      location: raw.module_location,
      contactId: raw.module_contact_id,
      level: raw.module_level,
      learningOutcomes: raw.module_learningoutcomes,
      moduleTags,
      popularityScore: raw.module_popularity_score,
      estimatedDifficulty: raw.module_estimated_difficulty,
      availableSpots: raw.module_available_spots,
      startDate,
      isFavourite:
        raw.isFavourite === true ||
        raw.isFavourite === 1 ||
        raw.isFavourite === '1',
    };
  }
}
