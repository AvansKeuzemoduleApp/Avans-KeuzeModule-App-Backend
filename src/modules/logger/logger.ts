import { Logger } from "@nestjs/common";
import { LoggerObject } from "./dto/logger-object.dto";

export class LoggerConversion {
    public static convert(data: LoggerObject, logger: Logger) {
        this.logMessage(data.level, JSON.stringify(data), logger)
    }

    private static logMessage(level: string, message: string, logger: Logger) {
        switch (level) {
            case 'warn':
                logger.warn(message);
                break;
            case 'error':
                logger.error(message);
                break;
            case 'log':
                logger.log(message);
                break;
            case 'fatal':
                logger.fatal(message);
                break;
            case 'debug':
                logger.debug(message);
                break;
            case 'verbose':
                logger.verbose(message);
                break;
        }
    }
}