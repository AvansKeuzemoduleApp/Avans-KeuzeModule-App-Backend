import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from './student-profile.entity';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

@Injectable()
export class ProfileService {
    private readonly logger = new Logger(ProfileService.name);

    constructor(
        @InjectRepository(StudentProfile)
        private readonly studentProfileRepo: Repository<StudentProfile>,
    ) { }

    /**
     * Helper function to convert undefined to null
     * 
     * Cause the PATCH had funky returns
     */
    private undefinedToNull<T>(value: T | undefined | null): T | null {
        return value === undefined ? null : value;
    }

    /**
     * Make sure a student profile exists for the given user.
     * 
     * creates one with default values if it doesnt exist
     */
    async ensureStudentProfileExists(userId: string): Promise<StudentProfile> {
        try {
            let profile = await this.studentProfileRepo.findOne({
                where: { userId },
            });
            if (profile) {
                return profile;
            }

            // Create profile if the user is new
            profile = this.studentProfileRepo.create({
                userId
            });
            await this.studentProfileRepo.save(profile);
            this.logger.log(`Created student profile for user ${userId}`);

            return profile;
        } catch (error: any) {
            // Handle duplicate (race condition)
            if (error?.code === 'ER_DUP_ENTRY' || error?.code === '23505') {
                const profile = await this.studentProfileRepo.findOne({
                    where: { userId },
                });
                if (profile) {
                    return profile;
                }
            }

            // Re throw new errors
            throw error;
        }
    }

    /**
     * returns ensureStudentProfileExists()
     * and hides some values
     */
    async getOrCreateStudentProfile(userId: string) {
        const profile = await this.ensureStudentProfileExists(userId);

        return {
            // id: profile.id,
            interests: this.undefinedToNull(profile.interests),
            merits: this.undefinedToNull(profile.merits),
            goals: this.undefinedToNull(profile.goals),
        };
    }

    /**
     * Updates a student profile
     */
    async updateStudentProfile(userId: string, dto: UpdateStudentProfileDto) {
        const profile = await this.ensureStudentProfileExists(userId); // fallback

        // Apply the DTO changes to the profile
        if (dto.interests !== undefined) {
            profile.interests = dto.interests;
        }
        if (dto.merits !== undefined) {
            profile.merits = dto.merits;
        }
        if (dto.goals !== undefined) {
            profile.goals = dto.goals;
        }

        this.logger.log(`Updated student profile for user ${userId}`);        if (dto.interests !== undefined) {
            profile.interests = dto.interests || null;
        }
        if (dto.merits !== undefined) {
            profile.merits = dto.merits || null;
        }
        if (dto.goals !== undefined) {
            profile.goals = dto.goals || null;
        }

        this.logger.log(`Updated student profile for user ${userId}`);
        await this.studentProfileRepo.save(profile);

        const response = {
            // id: profile.id,
            // created_at: profile.createdAt,
            // updated_at: profile.updatedAt,
            interests: this.undefinedToNull(profile.interests),
            merits: this.undefinedToNull(profile.merits),
            goals: this.undefinedToNull(profile.goals),
        };

        return response;
    }
}
