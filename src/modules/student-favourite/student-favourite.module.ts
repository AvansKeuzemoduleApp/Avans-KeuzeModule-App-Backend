import { Module } from '@nestjs/common';
import { StudentFavouriteController } from './student-favourite.controller';
import { StudentFavouriteService } from './student-favourite.service';

@Module({
  controllers: [StudentFavouriteController],
  providers: [StudentFavouriteService]
})
export class StudentFavouriteModule {}
