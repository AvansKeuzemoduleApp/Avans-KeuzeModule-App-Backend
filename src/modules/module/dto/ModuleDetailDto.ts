export class ModuleDetailDto {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  studyCredit: number;
  location: string;
  contactId: number;
  level: string;
  learningOutcomes: string;
  moduleTags: string[];
  popularityScore: number;
  estimatedDifficulty: number;
  availableSpots: number;
  startDate: string;

  isFavourite: boolean;
}
