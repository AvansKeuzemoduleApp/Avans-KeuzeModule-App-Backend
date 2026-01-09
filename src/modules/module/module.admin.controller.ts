import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtCookieAuthGuard } from '../auth/guards/jwt-cookie.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ModuleService } from './module.service';

@UseGuards(JwtCookieAuthGuard, RolesGuard)
@Roles('teacher')
@Controller('admin/modules')
export class ModuleAdminController {
    constructor(private readonly moduleService: ModuleService) {}

    @Post()
    create(@Body() dto: CreateModuleDto) {
        return this.moduleService.create(dto);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateModuleDto) {
        return this.moduleService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.moduleService.remove(id);
    }
}
