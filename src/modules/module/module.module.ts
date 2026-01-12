import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module as ModuleEntity } from './module.entity';
import { ModuleController } from './module.controller';
import { ModuleAdminController } from './module.admin.controller';
import { ModuleService } from './module.service';

@Module({
    imports: [TypeOrmModule.forFeature([ModuleEntity])],
    controllers: [ModuleController, ModuleAdminController],
    providers: [ModuleService],
    exports: [ModuleService],
})
export class ModuleModule {}

