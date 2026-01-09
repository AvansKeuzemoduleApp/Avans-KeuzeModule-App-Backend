import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentFavourite } from './student-favourite.entity';
import { ModuleService } from '../module/module.service';

@Injectable()
export class StudentFavouriteService {
    constructor(
        @InjectRepository(StudentFavourite)
        private readonly studentFavouriteRepo: Repository<StudentFavourite>,
        private readonly moduleService: ModuleService,
    ) { }

    async addFavourite(
        studentId: string,
        moduleId: number,
    ): Promise<StudentFavourite> {
        await this.moduleService.findOne(moduleId, undefined);
        const existingFavourite = await this.studentFavouriteRepo.findOne({
            where: { studentId, moduleId },
        });
        if (existingFavourite) {
            return existingFavourite;
        }


        const favourite = this.studentFavouriteRepo.create({
            studentId,
            moduleId,
        });

        try {
            return await this.studentFavouriteRepo.save(favourite);
        } catch (error: any) {
            // Handle race condition: if duplicate key error occurs, fetch and return existing record
            if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
                const existing = await this.studentFavouriteRepo.findOne({
                    where: { studentId, moduleId },
                });
                if (existing) {
                    return existing;
                }
            }
            throw error;
        }
    }

    async removeFavourite(studentId: string, moduleId: number): Promise<void> {
        const favourite = await this.studentFavouriteRepo.findOne({
            where: { studentId, moduleId },
        });

        if (!favourite) {
            return;
        }

        await this.studentFavouriteRepo.remove(favourite);
    }
}
