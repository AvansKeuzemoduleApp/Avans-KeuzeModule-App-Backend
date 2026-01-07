import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
    ) { }


    findByEmail(email: string) {
        return this.usersRepo.findOne({ where: { email } });
    }

    findById(id: string) {
        return this.usersRepo.findOne({ where: { id } });
    }

    async bumpTokenVersion(userId: string): Promise<void> {
        await this.usersRepo.increment({ id: userId }, 'tokenVersion', 1);
    }

    async createIfNotExists(email: string, passwordHash: string): Promise<User | null> {
        try {
            const user = this.usersRepo.create({
                email,
                passwordHash,
                tokenVersion: 0,
            });

            await this.usersRepo.insert(user);
            return user;
        }


        catch (e: any) {
            if (e?.code === 'ER_DUP_ENTRY') {
                return null;
            }

            throw e;
        }
    }
}

