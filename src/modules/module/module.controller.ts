import {
    Controller,
    Get,
    Logger,
    Param,
    ParseIntPipe,
    Query,
    Req,
} from '@nestjs/common';
import { ModuleService } from './module.service';
import { Public } from '../auth/guards/public.decorator';
import { QueryModuleDto } from './dto/query-module.dto';
import { LoggingHandler } from '../logger/LoggingHandler';

type RequestWithUser = Request & { user?: { sub: string }; method: string; originalUrl: string; path: string };

@Controller('modules')
export class ModuleController {
    private readonly logger = new Logger(ModuleController.name);

    constructor(private readonly moduleService: ModuleService) { }

    @Get()
    async findAll(@Req() req: RequestWithUser, @Query() query: QueryModuleDto) {
        const userId = req.user!.sub;
        const log = new LoggingHandler(this.logger, {
            userData: { userId: userId },
            level: "log",
            codeLocation: req.path,
            originalUrl: req.originalUrl,
            httpMethod: req.method,
        });

        try {
            const result = await this.moduleService.findAll(query, userId);
            log.update('httpResponse', 200).send();
            return result;
        } catch (e) {
            log.update('httpResponse', 500).update('level', 'error').update('errorMessage', e.message).send();
            throw e;
        }
    }

    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: RequestWithUser,
    ) {
        const userId = req.user?.sub;
        const log = new LoggingHandler(this.logger, {
            userData: userId ? { userId: userId } : undefined,
            level: "log",
            codeLocation: req.path,
            originalUrl: req.originalUrl,
            httpMethod: req.method,
        });

        try {
            const result = await this.moduleService.findOne(id, userId);
            log.update('httpResponse', 200).send();
            return result;
        } catch (e) {
            log.update('httpResponse', 500).update('level', 'error').update('errorMessage', e.message).send();
            throw e;
        }
    }
}
