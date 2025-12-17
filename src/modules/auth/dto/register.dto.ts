import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class RegisterDto{
    @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
    @IsEmail()
    @MaxLength(254)
    email!: string;


    @IsString()
    @MinLength(12)
    @MaxLength(128)
    @Matches(
        /^(?=\S{12,128}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/,{
            message: 'Password must be 12+ characters, include uppercase, lowercase, a number, and a symbol'
        }
    )
    password!: string;
}