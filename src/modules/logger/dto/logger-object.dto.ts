export interface LoggerObject {
    timestamp?: Date;
    userData: LoggerUserData | null;
    level: "log" | "fatal" | "error" | "warn" | "debug" | "verbose",
    codeLocation: string;
    isResponseLog: boolean; // whether this log was made in a controller before returning a response
    httpResponse: number | null; // only used when above is set to true
    httpMethod?: string; // GET, POST, PUT, DELETE, etc.
    requestBody?: any; // request body data (sanitized)
    errorMessage?: string; // error details if applicable
    userId?: string; // user ID if authenticated
}

export interface LoggerUserData {
    username: string
}