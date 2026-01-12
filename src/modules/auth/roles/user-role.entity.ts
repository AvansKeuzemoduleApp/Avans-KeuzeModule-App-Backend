import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity('user_roles')
export class UserRole {
    @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 36 })
    userId!: string;

    @PrimaryColumn({ name: 'role_id', type: 'int' })
    roleId!: number;

    @ManyToOne(() => Role, { eager: true })
    @JoinColumn({ name: 'role_id' })
    role!: Role;
}
