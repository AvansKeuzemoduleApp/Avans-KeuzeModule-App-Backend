import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('modules')
export class Module {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ name: 'shortdescription' })
    shortdescription!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ name: 'studycredit', type: 'int' })
    studycredit!: number;

    @Column()
    location!: string;

    @Column({ name: 'contact_id', type: 'int' })
    contactId!: number;

    @Column()
    level!: string;

    @Column({ type: 'text' })
    learningoutcomes!: string;

    @Column({ name: 'module_tags', type: 'json' })
    moduleTags!: string[];

    @Column({ name: 'interests_match_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
    interestsMatchScore?: number | null;

    @Column({ name: 'popularity_score', type: 'int' })
    popularityScore!: number;

    @Column({ name: 'estimated_difficulty', type: 'int' })
    estimatedDifficulty!: number;

    @Column({ name: 'available_spots', type: 'int' })
    availableSpots!: number;

    @Column({ name: 'start_date', type: 'date' })
    startDate!: string;

    @Column({ name: 'combined_text', type: 'text', nullable: true })
    combinedText?: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}

