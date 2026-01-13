import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger, } from '@nestjs/common';
import { LoggingHandler } from '../modules/logger/LoggingHandler';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();

        // Default safe response (no sensitive details)
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let body: any = {
            statusCode: status,
            message: 'Internal server error',
            path: req?.url,
            timestamp: new Date().toISOString(),
        };

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const response = exception.getResponse() as any;

            // Keep 4xx messages (useful for clients); sanitize 5xx
            if (status >= 500) {
                // Log 5xx errors server-side
                new LoggingHandler(this.logger, {
                    level: 'error',
                    codeLocation: `${req?.originalUrl}`,
                    httpResponse: status,
                    httpMethod: `${req?.method}`,
                    errorMessage: (exception as any)?.stack ?? String(exception)
                }).Send()

                body = { ...body, message: 'Internal server error' };

            } else {
                const msg = response?.message ?? response;
                new LoggingHandler(this.logger, {
                    level: 'warn',
                    codeLocation: `${req?.originalUrl}`,
                    httpResponse: status,
                    httpMethod: `${req?.method}`,
                    errorMessage: (exception as any)?.stack ?? String(exception),
                    programmerNote: `It's a user mistake.`,
                    responseMessage: msg
                }).Send()
                body = {
                    statusCode: status,
                    message: msg,
                    error: response?.error,
                    path: req?.url,
                    timestamp: new Date().toISOString(),
                };
            }
        } else {
            // Log full error server-side, return generic message to client
            new LoggingHandler(this.logger, {
                level: 'error',
                codeLocation: `${req?.originalUrl}`,
                httpResponse: status,
                httpMethod: `${req?.method}`,
                errorMessage: (exception as any)?.stack ?? String(exception)
            }).Send()
        }

        res.status(status).json(body);
    }
}
