import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';
import { UserRoleEntity } from './user-role.entity';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    
    constructor(
        @InjectRepository(UserEntity)
        private readonly usersRepo: Repository<UserEntity>,

        @InjectRepository(RoleEntity)
        private readonly rolesRepo: Repository<RoleEntity>,

        @InjectRepository(UserRoleEntity)
        private readonly userRolesRepo: Repository<UserRoleEntity>,
    ) {}

    private isDuplicateKeyError(err: any): boolean {
        const code = err?.code;
        const erno = err?.erno;
        const sqlState = err?.sqlState;
        return code === "ER_DUP_ENTRY" || erno === 1062 || sqlState === "23000";
    }

    findByEmail(email: string) {
        return this.usersRepo.findOne({ where: { email } });
    }

    findById(id: string) {
        return this.usersRepo.findOne({ where: { id } });
    }

    async bumpTokenVersion(userId: string): Promise<void> {
        await this.usersRepo.increment({ id: userId }, 'tokenVersion', 1);
    }

    async createIfNotExists(email: string, passwordHash: string): Promise<UserEntity | null> {
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

    async ensureRoleByName(userId: string, roleName: string): Promise<void> {
        const role = await this.rolesRepo.findOne({ where: { name: roleName } });
        if (!role) {
            throw new Error(`Role '${roleName}' not found.`);
        }

        try {
            await this.userRolesRepo.insert({ user_id: userId, role_id: role.id });
        } catch (err) {
            // idempotent if already assigned
            if (this.isDuplicateKeyError(err))
                return;

            throw err;
        }
    }

}

