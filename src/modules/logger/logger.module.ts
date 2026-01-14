import { Module } from '@nestjs/common';
import { LoggerController } from './logger.controller';
import { CustomLogger } from './logger.service';

@Module({
    controllers: [LoggerController],
    providers: [CustomLogger],
    exports: [CustomLogger],
})
export class LoggerModule {}
