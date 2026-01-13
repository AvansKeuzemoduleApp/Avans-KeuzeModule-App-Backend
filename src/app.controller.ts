import { Controller, Get, Logger, Req } from '@nestjs/common';
import { LoggingHandler } from './modules/logger/LoggingHandler';

type RequestWithUser = Request & { user?: any; method: string; originalUrl: string };

@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name);

    /**
     * Basic health endpoint.
     * With global prefix `api`, this responds on GET /api with HTTP 200.
     */
    @Get()
    health(@Req() req: RequestWithUser) {
        const log = new LoggingHandler(this.logger, {
            level: "log",
            codeLocation: req.originalUrl,
            httpResponse: 200,
            httpMethod: req.method,
        });
        log.Send();
        return { status: 'ok' };
    }
}


