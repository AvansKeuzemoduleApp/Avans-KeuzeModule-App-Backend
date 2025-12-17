import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';


@Injectable()
export class AuthService {
    // Dummy hash for timing-hardening when user does not exist.
    private static readonly DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO3XwWq2Ih2p9uWmZ.0J7Qb1g3iKQp5y2';

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    )   {}

    async register(dto: RegisterDto): Promise<void> {
        const email = dto.email.trim().toLowerCase();
        const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);
        const passwordHash = await bcrypt.hash(dto.password, rounds);

        await this.usersService.createIfNotExists(email, passwordHash);
    }

    async login (dto: LoginDto): Promise<{accessToken: string }> {
        const user = await this.usersService.findByEmail(dto.email);

        const hashToCheck = user?.passwordHash ?? AuthService.DUMMY_HASH;
        const ok = await bcrypt.compare(dto.password, hashToCheck);

        if (!user || !ok){
            throw new UnauthorizedException('Invalid Credentials');
        }
        
        const payload = { sub: user.id, email: user.email };
        const accessToken = await this.jwtService.signAsync(payload);

        return {accessToken}
    }
}
