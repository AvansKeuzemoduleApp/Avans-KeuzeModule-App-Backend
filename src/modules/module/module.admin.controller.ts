import { Body, Controller, Delete, Logger, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtCookieAuthGuard } from '../auth/guards/jwt-cookie.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ModuleService } from './module.service';
import { LoggingHandler } from '../logger/LoggingHandler';

type RequestWithUser = Request & { user?: { sub: string }; method: string; originalUrl: string };

@UseGuards(JwtCookieAuthGuard, RolesGuard)
@Roles('teacher')
@Controller('admin/modules')
export class ModuleAdminController {
    private readonly logger = new Logger(ModuleAdminController.name);

    constructor(private readonly moduleService: ModuleService) { }

    @Post()
    async create(@Body() dto: CreateModuleDto, @Req() req: RequestWithUser) {
        const userId = req.user?.sub;
        const log = new LoggingHandler(this.logger, {
            userData: userId ? { username: userId } : null,
            level: "log",
            codeLocation: req.originalUrl,
            isResponseLog: true,
            httpResponse: null,
            httpMethod: req.method,
            userId,
            requestBody: { name: dto.name },
        });

        try {
            const result = await this.moduleService.create(dto);
            log.Update('httpResponse', 201).Send();
            return result;
        } catch (e) {
            log.Update('httpResponse', 500).Update('level', 'error').Update('errorMessage', e.message).Send();
            throw e;
        }
    }

    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateModuleDto, @Req() req: RequestWithUser) {
        const userId = req.user?.sub;
        const log = new LoggingHandler(this.logger, {
            userData: userId ? { username: userId } : null,
            level: "log",
            codeLocation: req.originalUrl,
            isResponseLog: true,
            httpResponse: null,
            httpMethod: req.method,
            userId,
            requestBody: { moduleId: id },
        });

        try {
            const result = await this.moduleService.update(id, dto);
            log.Update('httpResponse', 200).Send();
            return result;
        } catch (e) {
            log.Update('httpResponse', 500).Update('level', 'error').Update('errorMessage', e.message).Send();
            throw e;
        }
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
        const userId = req.user?.sub;
        const log = new LoggingHandler(this.logger, {
            userData: userId ? { username: userId } : null,
            level: "log",
            codeLocation: req.originalUrl,
            isResponseLog: true,
            httpResponse: null,
            httpMethod: req.method,
            userId,
            requestBody: { moduleId: id },
        });

        try {
            const result = await this.moduleService.remove(id);
            log.Update('httpResponse', 200).Send();
            return result;
        } catch (e) {
            log.Update('httpResponse', 500).Update('level', 'error').Update('errorMessage', e.message).Send();
            throw e;
        }
    }
}
