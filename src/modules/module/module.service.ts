import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module } from './module.entity';

@Injectable()
export class ModuleService {
    constructor(
        @InjectRepository(Module)
        private readonly moduleRepo: Repository<Module>,
    ) { }

    async findAll(): Promise<Module[]> {
        return this.moduleRepo.find({
            order: {
                popularityScore: 'DESC',
            },
        });
    }

    async findOne(id: number): Promise<Module> {
        const module = await this.moduleRepo.findOne({ where: { id: id } });

        if (!module) {
            throw new NotFoundException(`Module with ID ${id} not found`);
        }

        return module;
    }
}

