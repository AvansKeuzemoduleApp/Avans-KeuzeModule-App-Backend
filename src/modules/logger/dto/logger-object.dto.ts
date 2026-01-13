export interface LoggerObject {
    timestamp?: Date;
    userData: LoggerUserData | null;
    level: "log" | "fatal" | "error" | "warn" | "debug" | "verbose",
    codeLocation: string;
    isResponseLog: boolean; // whether this log was made in a controller before returning a response
    httpResponse: number | null; // only used when above is set to true
}

export interface LoggerUserData {
    username: string
}