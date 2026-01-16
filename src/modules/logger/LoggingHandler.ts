import { Logger } from "@nestjs/common";
import { LoggerDebugData, LoggerDebugDataMapped, LoggerModuleData, LoggerModuleDataMapped, LoggerModuleFilterMapped, LoggerObject, LoggerObjectMapped, LoggerUserData, LoggerUserDataMapped } from "./dto/logger-object.dto";
import { randomUUID } from 'crypto';
import { VERSION } from "../../appVersion";

export class LoggingHandler {
    logger: Logger;
    data: LoggerObject;
    initTime: Date;
    updatedTime: Date;
    logId: string;
    constructor(logger: Logger, data: LoggerObject) {
        this.logger = logger;
        this.data = data;
        this.initTime = new Date();
        this.updatedTime = new Date();
        this.logId = randomUUID();
        this.sendLog("init");
    }

    public get(): LoggerObject {
        return this.data;
    }

    public set(data: LoggerObject): LoggingHandler {
        this.data = data;
        this.updatedTime = new Date();
        this.sendLog("midway-replacement");
        return this;
    }

    public update<K extends keyof LoggerObject>(key: K, value: LoggerObject[K]): LoggingHandler {
        this.data[key] = value;
        this.updatedTime = new Date();
        return this;
    }

    public updateUser<K extends keyof LoggerUserData>(key: K, value: LoggerUserData[K]): LoggingHandler {
        if (!this.data.userData) {
            this.data.userData = {};
        }
        this.data.userData[key] = value;
        this.updatedTime = new Date();
        return this;
    }

    public updateModule<K extends keyof LoggerModuleData>(key: K, value: LoggerModuleData[K]): LoggingHandler {
        if (!this.data.moduleData) {
            this.data.moduleData = {};
        }
        this.data.moduleData[key] = value;
        this.updatedTime = new Date();
        return this;
    }

    public updateDebug<K extends keyof LoggerDebugData>(key: K, value: LoggerDebugData[K]): LoggingHandler {
        if (!this.data.debugObject) {
            this.data.debugObject = {};
        }
        this.data.debugObject[key] = value;
        this.updatedTime = new Date();
        return this;
    }

    private mapper(logStatus: "init" | "closed" | "midway-replacement" | "partial"): LoggerObjectMapped {
        let userData: LoggerUserDataMapped | null = null;
        let moduleData: LoggerModuleDataMapped | null = null;
        let debugObject: LoggerDebugDataMapped | null = null;
        if (this.data.userData) {
            userData = {
                userId: this.data.userData.userId ?? null,
                username: this.data.userData.username ?? null,
                requestInterests: this.data.userData.requestInterests ?? null,
                requestMerits: this.data.userData.requestMerits ?? null,
                requestGoals: this.data.userData.requestGoals ?? null,
                requestRoleName: this.data.userData.requestRoleName ?? null,
                refreshTokenUsed: this.data.userData.refreshTokenUsed ?? null,
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
        if (this.data.debugObject) {
            let filterData: LoggerModuleFilterMapped | null = null;
            if (this.data.debugObject.filterData) {
                filterData = {
                    search: this.data.debugObject.filterData.search ?? null,
                    location: this.data.debugObject.filterData.location ?? null,
                    sortBy: this.data.debugObject.filterData.sortBy ?? null,
                    level: this.data.debugObject.filterData.level ?? null,
                    studyPoints: this.data.debugObject.filterData.studyPoints ?? null,
                    favourites: this.data.debugObject.filterData.favourites ?? null,
                    page: this.data.debugObject.filterData.page ?? null,
                }
            }
            debugObject = {
                value: this.data.debugObject.value ?? null,
                fieldName: this.data.debugObject.fieldName ?? null,
                filterData: filterData,
                filterJson: this.data.debugObject.filterJson ?? null,
                archiveFile: this.data.debugObject.archiveFile ?? null,
                FASTAPI_URL: this.data.debugObject.FASTAPI_URL ?? null,
                PAGE_SIZE: this.data.debugObject.PAGE_SIZE ?? null,
                VERSION: VERSION
            }
        }
        return {
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
            message: this.data.message ?? null,
            debugObject: debugObject,
            logStatus: logStatus,
            logId: this.logId,
            initTimestamp: this.initTime,
            lastChangeTimestamp: this.updatedTime
        }
    }

    /**
     * Partial will have set the `logStatus` to "partial". Only use this if you want a log in between the "init" and "closed" status of a log.
     * 
     * Example usecase: you have to do an api request and want to show that the API request was completed.
     */
    public sendPartial() {
        this.sendLog("partial");
    }

    public send() {
        this.sendLog("closed");
    }

    private sendLog(logStatus: "init" | "closed" | "midway-replacement" | "partial") {
        const converted = this.mapper(logStatus);
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