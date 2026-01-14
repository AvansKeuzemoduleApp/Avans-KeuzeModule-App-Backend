import { CreateModuleDto } from "../../module/dto/create-module.dto";
import { UpdateModuleDto } from "../../module/dto/update-module.dto";
import { LoggerModuleData } from "../dto/logger-object.dto";

export class ModuleLogMapper {
    public static CreateUpdateModule(dto: CreateModuleDto | UpdateModuleDto, moduleId?: number): LoggerModuleData {
        return {
            name: dto.name,
            requestShortdescription: dto.shortdescription,
            requestDescription: dto.description,
            requestStudycredit: dto.studycredit,
            requestLocation: dto.location,
            requestContact_id: dto.contact_id,
            requestLevel: dto.level,
            requestLearningoutcomes: dto.learningoutcomes,
            requestModule_tags: dto.module_tags,
            requestEstimated_difficulty: dto.estimated_difficulty,
            requestAvailable_spots: dto.available_spots,
            requestStart_date: dto.start_date,
            moduleId: moduleId || undefined
        };
    }
}