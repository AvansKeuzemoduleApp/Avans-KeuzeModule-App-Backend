import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: "roles" })
export class RoleEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 50, unique: true })
    name!: string;
}