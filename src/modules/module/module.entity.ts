import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('module_information')
export class Module {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ name: 'shortdescription' })
    shortDescription!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ name: 'studycredit', type: 'int' })
    studyCredit!: number;

    @Column()
    location!: string;

    @Column({ name: 'contact_id', type: 'int' })
    contactId!: number;

    @Column()
    level!: string;

    @Column({ name: 'learningoutcomes', type: 'text' })
    learningOutcomes!: string;

    @Column({ name: 'module_tags', type: 'json' })
    moduleTags!: string[];

    @Column({ name: 'popularity_score', type: 'int' })
    popularityScore!: number;

    @Column({ name: 'estimated_difficulty', type: 'int' })
    estimatedDifficulty!: number;

    @Column({ name: 'available_spots', type: 'int' })
    availableSpots!: number;

    @Column({ name: 'start_date', type: 'date' })
    startDate!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}

