import { Logger } from "@nestjs/common";
import { LoggerModuleData, LoggerModuleDataMapped, LoggerObject, LoggerObjectMapped, LoggerUserData, LoggerUserDataMapped } from "./dto/logger-object.dto";

export class LoggingHandler {
    logger: Logger;
    data: LoggerObject;
    constructor(logger: Logger, data: LoggerObject) {
        this.logger = logger;
        this.data = data;
        this.data.timestamp = new Date();
    }

    public Get(): LoggerObject {
        return this.data;
    }

    public Set(data: LoggerObject): LoggingHandler {
        this.data = data;
        this.data.timestamp = new Date();
        return this;
    }

    public Update<K extends keyof LoggerObject>(key: K, value: LoggerObject[K]): LoggingHandler {
        this.data[key] = value;
        this.data.timestamp = new Date();
        return this;
    }

    public UpdateUser<K extends keyof LoggerUserData>(key: K, value: LoggerUserData[K]): LoggingHandler {
        if (!this.data.userData) {
            this.data.userData = {};
        }
        this.data.userData[key] = value;
        this.data.timestamp = new Date();
        return this;
    }

    public UpdateModule<K extends keyof LoggerModuleData>(key: K, value: LoggerModuleData[K]): LoggingHandler {
        if (!this.data.moduleData) {
            this.data.moduleData = {};
        }
        this.data.moduleData[key] = value;
        this.data.timestamp = new Date();
        return this;
    }

    private Mapper(): LoggerObjectMapped {
        let userData: LoggerUserDataMapped | null = null;
        let moduleData: LoggerModuleDataMapped | null = null;
        if (this.data.userData) {
            userData = {
                userId: this.data.userData.userId ?? null,
                username: this.data.userData.username ?? null,
                requestInterests: this.data.userData.requestInterests ?? null,
                requestMerits: this.data.userData.requestMerits ?? null,
                requestGoals: this.data.userData.requestGoals ?? null,
                requestRoleName: this.data.userData.requestRoleName ?? null,
            }
        }
        if (this.data.moduleData) {
            moduleData = {
                moduleId: this.data.moduleData.moduleId ?? null,
                name: this.data.moduleData.name ?? null,
                requestShortdescription: this.data.moduleData.requestShortdescription ?? null,
                requestDescription: this.data.moduleData.requestDescription ?? null,
                requestStudycredit: this.data.moduleData.requestStudycredit ?? null,
                requestLocation: this.data.moduleData.requestLocation ?? null,
                requestContact_id: this.data.moduleData.requestContact_id ?? null,
                requestLevel: this.data.moduleData.requestLevel ?? null,
                requestLearningoutcomes: this.data.moduleData.requestLearningoutcomes ?? null,
                requestModule_tags: this.data.moduleData.requestModule_tags ?? null,
                requestPopularity_score: this.data.moduleData.requestPopularity_score ?? null,
                requestEstimated_difficulty: this.data.moduleData.requestEstimated_difficulty ?? null,
                requestAvailable_spots: this.data.moduleData.requestAvailable_spots ?? null,
                requestStart_date: this.data.moduleData.requestStart_date ?? null,
            }
        }
        return {
            timestamp: this.data.timestamp,
            userData: userData,
            level: this.data.level,
            codeLocation: this.data.codeLocation,
            httpResponse: this.data.httpResponse ?? null,
            httpMethod: this.data.httpMethod ?? null,
            requestBody: this.data.requestBody ?? null,
            errorMessage: this.data.errorMessage ?? null,
            programmerNote: this.data.programmerNote ?? null,
            responseMessage: this.data.responseMessage ?? null,
            originalUrl: this.data.originalUrl ?? null,
            securityAlert: this.data.securityAlert ?? false,
            moduleData: moduleData,
            message: this.data.message ?? null
        }
    }

    public Send() {
        const converted = this.Mapper()
        switch (this.data.level) {
            case 'warn':
                this.logger.warn(converted);
                break;
            case 'error':
                this.logger.error(converted);
                break;
            case 'log':
                this.logger.log(converted);
                break;
            case 'fatal':
                this.logger.fatal(converted);
                break;
            case 'debug':
                this.logger.debug(converted);
                break;
            case 'verbose':
                this.logger.verbose(converted);
                break;
        }
    }
}