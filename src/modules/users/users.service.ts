import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { LoggingHandler } from '../logger/LoggingHandler';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
    ) { }


    findByEmail(email: string) {
        new LoggingHandler(this.logger, {
            level: 'debug',
            codeLocation: 'findByEmail',
            userData: {
                username: email
            }
        }).send();
        return this.usersRepo.findOne({ where: { email } });
    }

    findById(id: string) {
        new LoggingHandler(this.logger, {
            level: 'debug',
            codeLocation: 'findById',
            userData: {
                userId: id
            }
        }).send();
        return this.usersRepo.findOne({ where: { id } });
    }

    async bumpTokenVersion(userId: string): Promise<void> {
        new LoggingHandler(this.logger, {
            level: 'debug',
            codeLocation: 'bumpTokenVersion',
            userData: {
                userId: userId
            }
        }).send();
        await this.usersRepo.increment({ id: userId }, 'tokenVersion', 1);
    }

    async createIfNotExists(email: string, passwordHash: string): Promise<User | null> {
        const log = new LoggingHandler(this.logger, {
            level: 'debug',
            codeLocation: 'createIfNotExists',
            userData: {
                username: email
            }
        });
        try {
            const user = this.usersRepo.create({
                email,
                passwordHash,
                tokenVersion: 0,
            });
            await this.usersRepo.insert(user);
            log.update("message", "added to DB").send();
            return user;
        }


        catch (e: any) {
            log.update("errorMessage", e).update("level", "error").send();
            if (e?.code === 'ER_DUP_ENTRY') {
                return null;
            }

            throw e;
        }
    }
}

