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


    async createUser(email: string, passwordHash: string){
        const existing = await this.findByEmail(email);

        if(existing)
            throw new ConflictException('Email already in use');

        const user = this.usersRepo.create({email, passwordHash});
        return this.usersRepo.save(user);
    }
}

