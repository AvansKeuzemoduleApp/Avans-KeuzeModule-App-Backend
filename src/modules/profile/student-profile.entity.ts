import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('student_profiles')
export class StudentProfile {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id', unique: true })
    userId!: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column({ nullable: true })
    interests?: string;

    @Column({ nullable: true })
    merits?: string;

    @Column({ nullable: true })
    goals?: string;

    @Column({ name: 'preferred_location', nullable: true })
    preferredLocation?: string;

    @Column({ name: 'preferred_studycredits', type: 'int', nullable: true })
    preferredStudycredits?: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
