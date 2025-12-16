import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService) {}

    async register(dto: RegisterDto){
        const rounds = Number(process.env.BCRYPT_ROUNDS);
        const passwordHash = await bcrypt.hash(dto.password, rounds);

        const user = await this.usersService.createUser(dto.email, passwordHash);

        return {
            id: user.id,
            email: user.email
        };
    }
}