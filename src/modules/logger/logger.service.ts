import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class CustomLogger implements LoggerService {
    private logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    level: 'debug',
                }),
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.errors({ stack: true }),
                        winston.format.json(),
                        winston.format.printf((info) => {
                            return JSON.stringify(info) + '\n';
                        })
                    ),
                    level: 'warn',
                }),
            ],
        });
    }

    private formatLog(message: any, optionalParams: any[]) {
        const context = optionalParams.length > 0 ? optionalParams[optionalParams.length - 1] : undefined;
        const isContext = typeof context === 'string';

        return {
            message,
            context: isContext ? context : undefined,
            ...(!isContext && optionalParams.length > 0 ? { meta: optionalParams } : {}),
        };
    }

    log(message: any, ...optionalParams: any[]) {
        this.logger.info(this.formatLog(message, optionalParams));
    }

    error(message: any, ...optionalParams: any[]) {
        this.logger.error(this.formatLog(message, optionalParams));
    }

    warn(message: any, ...optionalParams: any[]) {
        this.logger.warn(this.formatLog(message, optionalParams));
    }

    debug(message: any, ...optionalParams: any[]) {
        this.logger.debug(this.formatLog(message, optionalParams));
    }

    verbose(message: any, ...optionalParams: any[]) {
        this.logger.verbose(this.formatLog(message, optionalParams));
    }

    fatal(message: any, ...optionalParams: any[]) {
        this.logger.error(this.formatLog(message, optionalParams));
    }
}