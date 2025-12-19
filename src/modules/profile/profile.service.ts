import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from './student-profile.entity';

@Injectable()
export class ProfileService {
    private readonly logger = new Logger(ProfileService.name);

    constructor(
        @InjectRepository(StudentProfile)
        private readonly studentProfileRepo: Repository<StudentProfile>,
    ) { }

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
                userId,
                interests: undefined,
                merits: undefined,
                goals: undefined,
                preferredLocation: undefined,
                preferredStudycredits: undefined,
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
            interests: profile.interests,
            merits: profile.merits,
            goals: profile.goals,
            preferred_location: profile.preferredLocation,
            preferred_studycredits: profile.preferredStudycredits
        };
    }
}
