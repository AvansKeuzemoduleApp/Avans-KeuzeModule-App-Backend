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
  ) {}

  async addFavourite(
    studentId: string,
    moduleId: number,
  ): Promise<StudentFavourite> {
    await this.moduleService.findOne(moduleId, undefined);
    const existingFavourite = await this.studentFavouriteRepo.findOne({
      where: { studentId, moduleId },
    });
    if (existingFavourite) {
      throw new ConflictException('Module is already in favourites');
    }

    const favourite = this.studentFavouriteRepo.create({
      studentId,
      moduleId,
    });

    try {
      return await this.studentFavouriteRepo.save(favourite);
    } catch (error: any) {
      // Handle potential race condition where another request inserts the same favourite
      const errorCode = error?.code;
      if (
        errorCode === '23505' || // PostgreSQL unique_violation
        errorCode === 'ER_DUP_ENTRY' || // MySQL duplicate entry
        errorCode === 'SQLITE_CONSTRAINT' // SQLite constraint violation
      ) {
        throw new ConflictException('Module is already in favourites');
      }
      throw error;
    }
  }

  async removeFavourite(studentId: string, moduleId: number): Promise<void> {
    const favourite = await this.studentFavouriteRepo.findOne({
      where: { studentId, moduleId },
    });

    if (!favourite) {
      throw new NotFoundException('Favourite not found');
    }

    await this.studentFavouriteRepo.remove(favourite);
  }
}
