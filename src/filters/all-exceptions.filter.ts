import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger, } from '@nestjs/common';

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
                this.logger.error(
                    `HttpException ${status} on ${req?.method} ${req?.url}`,
                    (exception as any)?.stack ?? String(exception),
                );

                body = { ...body, message: 'Internal server error' };

            } else {
                const msg = response?.message ?? response;
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
            this.logger.error(
                `Unhandled exception on ${req?.method} ${req?.url}`,
                (exception as any)?.stack ?? String(exception),
            );
        }

        res.status(status).json(body);
    }
}
