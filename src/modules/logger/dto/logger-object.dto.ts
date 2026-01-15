export interface LoggerObject {
    timestamp?: Date;
    userData?: LoggerUserData;
    level: "log" | "fatal" | "error" | "warn" | "debug" | "verbose",
    codeLocation: string;
    httpResponse?: number; // 404, 200, 500, 401, 400, 403 etc
    httpMethod?: string; // GET, POST, PUT, DELETE, etc.
    requestBody?: any; // request body data (sanitized)
    errorMessage?: string; // error details if applicable
    programmerNote?: string; // a comment that a programmer can add to this log statement
    responseMessage?: string; // the response message given to the user
    originalUrl?: string;
    securityAlert?: boolean;
    moduleData?: LoggerModuleData;
    message?: string;
    debugObject?: LoggerDebugData;
}

export interface LoggerObjectMapped {
    timestamp?: Date;
    userData: LoggerUserDataMapped | null;
    level: "log" | "fatal" | "error" | "warn" | "debug" | "verbose",
    codeLocation: string;
    httpResponse: number | null; // 404, 200, 500, 401, 400, 403 etc
    httpMethod: string | null; // GET, POST, PUT, DELETE, etc.
    requestBody: any | null; // request body data (sanitized)
    errorMessage: string | null; // error details if applicable
    programmerNote: string | null; // a comment that a programmer can add to this log statement
    responseMessage: string | null; // the response message given to the user
    originalUrl: string | null;
    securityAlert: boolean;
    moduleData: LoggerModuleDataMapped | null;
    message: string | null;
    debugObject: LoggerDebugDataMapped | null;
    logStatus?: "init" | "closed";
    logId?: string
}

export interface LoggerUserData {
    username?: string;
    userId?: string;
    requestInterests?: string;
    requestMerits?: string;
    requestGoals?: string;
    requestRoleName?: string;
    refreshTokenUsed?: string;
}

export interface LoggerUserDataMapped {
    username: string | null;
    userId: string | null;
    requestInterests: string | null;
    requestMerits: string | null;
    requestGoals: string | null;
    requestRoleName: string | null;
    refreshTokenUsed: string | null;
}

export interface LoggerDebugData {
    value?: string;
    fieldName?: string;
    filterData?: LoggerModuleFilterData;
    filterJson?: string;
    archiveFile?: string;
}

export interface LoggerDebugDataMapped {
    value: string | null;
    fieldName: string | null;
    filterData: LoggerModuleFilterMapped | null;
    filterJson: string | null;
    archiveFile: string | null;
}

export interface LoggerModuleFilterData {
    search?: string;
    location?: string;
    sortBy?: string;
    level?: string;
    studyPoints?: string;
    favourites?: boolean;
    page?: number;
}

export interface LoggerModuleFilterMapped {
    search: string | null;
    location: string | null;
    sortBy: string | null;
    level: string | null;
    studyPoints: string | null;
    favourites: boolean | null;
    page: number | null;
}

export interface LoggerModuleData {
    moduleId?: number;
    name?: string;
    requestShortdescription?: string;
    requestDescription?: string;
    requestStudycredit?: number;
    requestLocation?: string;
    requestContact_id?: number;
    requestLevel?: string;
    requestLearningoutcomes?: string;
    requestModule_tags?: string[];
    requestPopularity_score?: number;
    requestEstimated_difficulty?: number;
    requestAvailable_spots?: number;
    requestStart_date?: string;
}

export interface LoggerModuleDataMapped {
    moduleId: number | null;
    name: string | null;
    requestShortdescription: string | null;
    requestDescription: string | null;
    requestStudycredit: number | null;
    requestLocation: string | null;
    requestContact_id: number | null;
    requestLevel: string | null;
    requestLearningoutcomes: string | null;
    requestModule_tags: string[] | null;
    requestPopularity_score: number | null;
    requestEstimated_difficulty: number | null;
    requestAvailable_spots: number | null;
    requestStart_date: string | null;
}