import { Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "user_roles" })
export class UserRoleEntity {
    @PrimaryColumn({ type: "uuid" })
    user_id!: string;

    @PrimaryColumn({ type: "int" })
    role_id!: number;
}