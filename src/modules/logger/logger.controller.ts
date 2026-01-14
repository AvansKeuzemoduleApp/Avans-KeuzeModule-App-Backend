import { Controller, Get, Logger, NotFoundException, StreamableFile } from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Transform } from 'stream';

@Controller('logs')
export class LoggerController {
    private readonly logger = new Logger(LoggerController.name);

    @Get()
    getCombinedLog(): StreamableFile {
        const logPath = join(process.cwd(), 'logs', 'combined.log');

        if (!existsSync(logPath)) {
            this.logger.warn(`Log file not found: ${logPath}`);
            throw new NotFoundException('Log file not found');
        }

        const file = createReadStream(logPath);
        let isFirst = true;
        const shouldFilterStringMessages = true;
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

                let modified = lines.join(',\n');

                if (isFirst && modified) {
                    modified = '[' + modified;
                    isFirst = false;
                } else if (modified) {
                    modified = ',\n' + modified;
                }
                callback(null, modified);
            },
            flush(callback) {
                callback(null, ']');
            },
        });

        return new StreamableFile(file.pipe(transform), {
            type: 'application/json',
            disposition: 'inline; filename="combined.log"',
        });
    }
}