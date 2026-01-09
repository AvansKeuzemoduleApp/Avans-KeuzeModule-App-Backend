export class ModuleDetailDto {
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
}
