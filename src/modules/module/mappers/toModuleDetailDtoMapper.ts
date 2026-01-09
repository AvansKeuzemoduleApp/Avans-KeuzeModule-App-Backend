import { ModuleDetailDto } from '../dto/moduledetail-response.dto';

export class ModuleMapper {
  static toDetailDto(raw: any): ModuleDetailDto {
    const tagsRaw = raw.module_module_tags;
    let moduleTags: any[] = [];
    if (Array.isArray(tagsRaw)) {
      moduleTags = tagsRaw;
    } else if (typeof tagsRaw === 'string') {
      try {
        moduleTags = JSON.parse(tagsRaw);
      } catch {
        moduleTags = [];
      }
    }
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
      shortdescription: raw.module_shortdescription,
      description: raw.module_description,
      studycredit: raw.module_studycredit,
      location: raw.module_location,
      contact_id: raw.module_contact_id,
      level: raw.module_level,
      learningoutcomes: raw.module_learningoutcomes,
      module_tags: moduleTags,
      popularity_score: raw.module_popularity_score,
      estimated_difficulty: raw.module_estimated_difficulty,
      available_spots: raw.module_available_spots,
      start_date: startDate,
      isFavourite:
        raw.isFavourite === true ||
        raw.isFavourite === 1 ||
        raw.isFavourite === '1',
    };
  }
}
