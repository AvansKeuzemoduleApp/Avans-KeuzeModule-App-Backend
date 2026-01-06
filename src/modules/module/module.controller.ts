import { Controller, Get, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import { ModuleService } from './module.service';
import { Public } from '../auth/guards/public.decorator';
import { QueryModuleDto } from './dto/query-module.dto';

type RequestWithUser = Request & { user?: { sub: string } };

@Controller('modules')
export class ModuleController {
    constructor(private readonly moduleService: ModuleService) { }

    @Get()
    async findAll(
        @Req() req: RequestWithUser,
        @Query() query: QueryModuleDto
    ) {
        if (!req.user?.sub) {
            query.favourites = false;
        }
        return this.moduleService.findAll(query, req.user?.sub);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.moduleService.findOne(id);
    }
}

