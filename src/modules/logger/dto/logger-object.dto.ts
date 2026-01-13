export interface LoggerObject {
    timestamp: string;
    userData: any | null;
    level: "log" | "fatal" | "error" | "warn" | "debug" | "verbose"
}