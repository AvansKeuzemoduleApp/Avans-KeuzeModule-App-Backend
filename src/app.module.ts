import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ModuleModule } from './modules/module/module.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),

        TypeOrmModule.forRoot({
            type: 'mariadb',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            autoLoadEntities: true,

            //TODO (REMOVE THIS DEV OPTION)
            synchronize: process.env.DB_SYNCHRONIZE === 'true'
        }),

        ThrottlerModule.forRoot({
            throttlers: [{ ttl: 60, limit: 100 }],
        }),

        UsersModule,
        AuthModule,
        ProfileModule,
        ModuleModule
    ],
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard, },
    ],
})

export class AppModule { }