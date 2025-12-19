import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
    ) {}


    findByEmail(email: string) {
        return this.usersRepo.findOne({where: {email}});
    }

    findById(id: string) {
        return this.usersRepo.findOne({ where: { id } });
    }

    async createIfNotExists(email: string, passwordHash: string): Promise<void> {
        try {
            const user = this.usersRepo.create({
                email,
                passwordHash,
            });
        
            await this.usersRepo.insert(user);
        }

        
        catch (e: any){
            if (e?.code === 'ER_DUP_ENTRY') {
                return;
            }

            throw e;
        }
    }
}

