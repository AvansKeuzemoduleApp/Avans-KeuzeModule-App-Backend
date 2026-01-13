import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { StudentProfile } from './student-profile.entity';

@Module({
    imports: [TypeOrmModule.forFeature([StudentProfile])],
    controllers: [ProfileController],
    providers: [ProfileService],
    exports: [ProfileService]
})
export class ProfileModule { }
