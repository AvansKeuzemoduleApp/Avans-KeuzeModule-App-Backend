import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentFavouriteController } from './student-favourite.controller';
import { StudentFavouriteService } from './student-favourite.service';
import { StudentFavourite } from './student-favourite.entity';
import { ModuleModule } from '../module/module.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([StudentFavourite]),
        ModuleModule,
    ],
    controllers: [StudentFavouriteController],
    providers: [StudentFavouriteService],
})
export class StudentFavouriteModule { }
