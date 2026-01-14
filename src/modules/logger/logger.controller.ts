import { Controller, Get, Logger, NotFoundException, StreamableFile, Query, BadRequestException, Req, UseGuards } from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Transform } from 'stream';
import { LogFilterEvaluator } from './helpers/log-filter-evaluator';
import { LogFilter } from './dto/log-filter.dto';
import { LoggerObjectMapped } from './dto/logger-object.dto';
import { LoggingHandler } from './LoggingHandler';
import { Roles } from '../auth/guards/roles.decorator';
import { JwtCookieAuthGuard } from '../auth/guards/jwt-cookie.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

type RequestWithUser = Request & { user?: { sub: string }; method: string; originalUrl: string; path: string };

@UseGuards(JwtCookieAuthGuard, RolesGuard)
@Roles('teacher')
@Controller('logs')
export class LoggerController {
    private readonly logger = new Logger(LoggerController.name);
    private readonly filterEvaluator = new LogFilterEvaluator();

    @Get()
    getCombinedLog(@Req() req: RequestWithUser, @Query('filter') filterJson?: string): StreamableFile {
        const logPath = join(process.cwd(), 'logs', 'combined.log');
        const userId = req.user?.sub;
        const log = new LoggingHandler(this.logger, {
            userData: userId ? { userId: userId } : undefined,
            level: "warn",
            codeLocation: req.path,
            originalUrl: req.originalUrl,
            httpMethod: req.method,
            securityAlert: true,
            debugObject: {
                filterJson: filterJson
            }
        });

        if (!existsSync(logPath)) {
            log.Update("message", `Log file not found: ${logPath}`).Update("httpResponse", 404).Send()
            throw new NotFoundException('Log file not found');
        }

        // Parse filter if provided
        let filter: LogFilter | null = null;
        if (filterJson) {
            try {
                filter = JSON.parse(filterJson);
            } catch (e) {
                log.Update("message", `Invalid filter JSON`).Update("httpResponse", 400).Send()
                throw new BadRequestException('Invalid filter JSON');
            }
        }

        const file = createReadStream(logPath);
        let isFirst = true;
        let hasOutputStartBracket = false;
        const shouldFilterStringMessages = true;
        const filterEvaluator = this.filterEvaluator;

        const transform = new Transform({
            transform(chunk, encoding, callback) {
                let lines = chunk
                    .toString()
                    .split('\n')
                    .filter(line => line.trim());

                if (shouldFilterStringMessages) {
                    lines = lines.filter(line => {
                        try {
                            const parsed = JSON.parse(line);
                            return typeof parsed.message === 'object';
                        } catch {
                            return false;
                        }
                    });
                }

                // Apply custom filter if provided
                if (filter) {
                    lines = lines.filter(line => {
                        try {
                            const parsed: LoggerObjectMapped = JSON.parse(line);
                            return filterEvaluator.evaluate(parsed, filter);
                        } catch {
                            return false;
                        }
                    });
                }

                let modified = lines.join(',\n');

                if (isFirst && modified) {
                    modified = '[' + modified;
                    isFirst = false;
                    hasOutputStartBracket = true;
                } else if (modified) {
                    modified = ',\n' + modified;
                }
                callback(null, modified);
            },
            flush(callback) {
                // Only output closing bracket if we started the array
                callback(null, hasOutputStartBracket ? ']' : '[]');
            },
        });
        log.Send();
        return new StreamableFile(file.pipe(transform), {
            type: 'application/json',
            disposition: 'inline; filename="combined.log"',
        });
    }
}