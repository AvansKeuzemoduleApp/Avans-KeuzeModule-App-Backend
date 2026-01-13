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
                    level: 'info',
                }),
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.errors({ stack: true }),
                        winston.format.json()
                    ),
                    level: 'warn',
                }),
            ],
        });
    }

    log(message: any, ...optionalParams: any[]) {
        this.logger.info(message, ...optionalParams);
    }

    error(message: any, ...optionalParams: any[]) {
        this.logger.error(message, ...optionalParams);
    }

    warn(message: any, ...optionalParams: any[]) {
        this.logger.warn(message, ...optionalParams);
    }

    debug(message: any, ...optionalParams: any[]) {
        this.logger.debug(message, ...optionalParams);
    }

    verbose(message: any, ...optionalParams: any[]) {
        this.logger.verbose(message, ...optionalParams);
    }

    fatal(message: any, ...optionalParams: any[]) {
        this.logger.error(message, ...optionalParams);
    }
}