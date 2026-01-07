import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UsersService } from './users.service';
import { RoleEntity } from './role.entity';
import { UserRoleEntity } from './user-role.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, UserRoleEntity])],
    providers: [UsersService],
    exports: [UsersService],
})

export class UsersModule{}