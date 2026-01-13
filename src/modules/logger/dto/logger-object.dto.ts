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
}

export interface LoggerObjectMapped {
    timestamp?: Date;
    userData: LoggerUserData | null;
    level: "log" | "fatal" | "error" | "warn" | "debug" | "verbose",
    codeLocation: string;
    httpResponse: number | null; // 404, 200, 500, 401, 400, 403 etc
    httpMethod: string | null; // GET, POST, PUT, DELETE, etc.
    requestBody: any | null; // request body data (sanitized)
    errorMessage: string | null; // error details if applicable
    programmerNote: string | null; // a comment that a programmer can add to this log statement
    responseMessage: string | null; // the response message given to the user
}

export interface LoggerUserData {
    username?: string;
    userId?: string;
}