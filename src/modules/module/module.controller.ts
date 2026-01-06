import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ModuleService } from './module.service';
import { Public } from '../auth/guards/public.decorator';

@Controller('modules')
export class ModuleController {
    constructor(private readonly moduleService: ModuleService) {}

    @Public()
    @Get()
    async findAll() {
        return this.moduleService.findAll();
    }

    @Public()
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.moduleService.findOne(id);
    }
}

