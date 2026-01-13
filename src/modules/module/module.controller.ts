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

type RequestWithUser = Request & { user?: { sub: string }; method: string; originalUrl: string };

@Controller('modules')
export class ModuleController {
    private readonly logger = new Logger(ModuleController.name);

    constructor(private readonly moduleService: ModuleService) { }

    @Get()
    async findAll(@Req() req: RequestWithUser, @Query() query: QueryModuleDto) {
        const userId = req.user!.sub;
        const log = new LoggingHandler(this.logger, {
            userData: { username: userId },
            level: "log",
            codeLocation: req.originalUrl,
            isResponseLog: true,
            httpResponse: null,
            httpMethod: req.method,
            userId,
        });

        try {
            const result = await this.moduleService.findAll(query, userId);
            log.Update('httpResponse', 200).Send();
            return result;
        } catch (e) {
            log.Update('httpResponse', 500).Update('level', 'error').Update('errorMessage', e.message).Send();
            throw e;
        }
    }

    @Public()
    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: RequestWithUser,
    ) {
        const userId = req.user?.sub;
        const log = new LoggingHandler(this.logger, {
            userData: userId ? { username: userId } : null,
            level: "log",
            codeLocation: req.originalUrl,
            isResponseLog: true,
            httpResponse: null,
            httpMethod: req.method,
            userId,
        });

        try {
            const result = await this.moduleService.findOne(id, userId);
            log.Update('httpResponse', 200).Send();
            return result;
        } catch (e) {
            log.Update('httpResponse', 500).Update('level', 'error').Update('errorMessage', e.message).Send();
            throw e;
        }
    }
}
