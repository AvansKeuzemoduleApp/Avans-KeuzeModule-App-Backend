import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Module } from '../module/module.entity';

@Entity('student_favourites')
export class StudentFavourite {
    @PrimaryColumn({ name: 'student_id', type: 'uuid' })
    studentId!: string;

    @PrimaryColumn({ name: 'module_id', type: 'int' })
    moduleId!: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'student_id' })
    student!: User;

    @ManyToOne(() => Module, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'module_id' })
    module!: Module;
}

