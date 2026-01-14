import { Module } from '@nestjs/common';
import { LoggerController } from './logger.controller';
import { CustomLogger } from './logger.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [LoggerController],
    providers: [CustomLogger],
    exports: [CustomLogger],
})
export class LoggerModule { }
