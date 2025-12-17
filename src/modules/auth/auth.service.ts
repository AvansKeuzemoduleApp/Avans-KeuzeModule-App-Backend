import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService) {}

    async register(dto: RegisterDto): Promise<void> {
        const email = dto.email.trim().toLowerCase();
        const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);

        const passwordHash = await bcrypt.hash(dto.password, rounds);

        await this.usersService.createIfNotExists(email, passwordHash);
    }
}
