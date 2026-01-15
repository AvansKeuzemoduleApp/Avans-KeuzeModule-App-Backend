import {
    Injectable,
    Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentFavourite } from './student-favourite.entity';
import { ModuleService } from '../module/module.service';
import { LoggingHandler } from '../logger/LoggingHandler';

@Injectable()
export class StudentFavouriteService {
    private readonly logger = new Logger(StudentFavouriteService.name);
    constructor(
        @InjectRepository(StudentFavourite)
        private readonly studentFavouriteRepo: Repository<StudentFavourite>,
        private readonly moduleService: ModuleService,
    ) { }

    async addFavourite(
        studentId: string,
        moduleId: number,
    ): Promise<StudentFavourite> {
        const log = new LoggingHandler(this.logger, {
            level: 'debug',
            codeLocation: 'addFavourite',
            userData: {
                userId: studentId
            },
            moduleData: {
                moduleId: moduleId
            }
        });
        await this.moduleService.findOne(moduleId, undefined);
        const existingFavourite = await this.studentFavouriteRepo.findOne({
            where: { studentId, moduleId },
        });
        if (existingFavourite) {
            log.update("message", "already existed in DB").send();
            return existingFavourite;
        }


        const favourite = this.studentFavouriteRepo.create({
            studentId,
            moduleId,
        });

        try {
            log.update("message", "updating DB").send();
            return await this.studentFavouriteRepo.save(favourite);
        } catch (error: any) {
            // Handle race condition: if duplicate key error occurs, fetch and return existing record
            log.update("errorMessage", error).update("level", "error").send();
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
        const log = new LoggingHandler(this.logger, {
            level: 'debug',
            codeLocation: 'removeFavourite',
            userData: {
                userId: studentId
            },
            moduleData: {
                moduleId: moduleId
            }
        });
        const favourite = await this.studentFavouriteRepo.findOne({
            where: { studentId, moduleId },
        });

        if (!favourite) {
            log.update("message", "never existed in DB").send();
            return;
        }

        log.update("message", "updating DB").send();
        await this.studentFavouriteRepo.remove(favourite);
    }
}
