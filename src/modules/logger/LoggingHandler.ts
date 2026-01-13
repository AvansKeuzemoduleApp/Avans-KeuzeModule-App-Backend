import { Logger } from "@nestjs/common";
import { LoggerObject } from "./dto/logger-object.dto";

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

    public Send() {
        const converted = JSON.stringify(this.data)
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