import { Body, Controller, Delete, Logger, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtCookieAuthGuard } from '../auth/guards/jwt-cookie.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ModuleService } from './module.service';
import { LoggingHandler } from '../logger/LoggingHandler';
import { ModuleLogMapper } from '../logger/helpers/module-log-mapper';

type RequestWithUser = Request & { user?: { sub: string }; method: string; originalUrl: string; path: string };

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
            userData: userId ? { userId: userId } : undefined,
            level: "log",
            codeLocation: req.path,
            originalUrl: req.originalUrl,
            httpMethod: req.method,
            securityAlert: true,
            moduleData: ModuleLogMapper.CreateUpdateModule(dto)
        });

        try {
            const result = await this.moduleService.create(dto);
            log.update('httpResponse', 201).send();
            return result;
        } catch (e) {
            log.update('httpResponse', 500).update('level', 'error').update('errorMessage', e.message).send();
            throw e;
        }
    }

    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateModuleDto, @Req() req: RequestWithUser) {
        const userId = req.user?.sub;
        const log = new LoggingHandler(this.logger, {
            userData: userId ? { userId: userId } : undefined,
            level: "log",
            codeLocation: req.path,
            originalUrl: req.originalUrl,
            httpMethod: req.method,
            requestBody: { moduleId: id },
            securityAlert: true,
            moduleData: ModuleLogMapper.CreateUpdateModule(dto)
        });

        try {
            const result = await this.moduleService.update(id, dto);
            log.update('httpResponse', 200).send();
            return result;
        } catch (e) {
            log.update('httpResponse', 500).update('level', 'error').update('errorMessage', e.message).send();
            throw e;
        }
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
        const userId = req.user?.sub;
        const log = new LoggingHandler(this.logger, {
            userData: userId ? { userId: userId } : undefined,
            level: "log",
            codeLocation: req.path,
            originalUrl: req.originalUrl,
            httpMethod: req.method,
            requestBody: { moduleId: id },
            securityAlert: true,
            moduleData: {
                moduleId: id
            }
        });

        try {
            const result = await this.moduleService.remove(id);
            log.update('httpResponse', 200).send();
            return result;
        } catch (e) {
            log.update('httpResponse', 500).update('level', 'error').update('errorMessage', e.message).send();
            throw e;
        }
    }
}
