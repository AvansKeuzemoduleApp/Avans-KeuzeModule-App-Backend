import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import axios from 'axios';

@Injectable()
export class CustomLogger implements LoggerService {
    private logger: winston.Logger;
    private discordToken: string | undefined;
    private discordChannelId: string | undefined;
    private readonly DISCORD_MAX_LENGTH = 2000;
    private readonly MIN_LOG_LEVEL_FOR_DISCORD = 3; // error and fatal
    private messageQueue: { embed: any; resolve: () => void }[] = [];
    private isProcessingQueue = false;

    constructor() {
        this.discordToken = process.env.DISCORD_TOKEN;
        this.discordChannelId = process.env.CHANNEL_ID;
        this.logger = winston.createLogger({
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    level: 'debug',
                }),
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.errors({ stack: true }),
                        winston.format.json(),
                        winston.format.printf((info) => {
                            return JSON.stringify(info) + '\n';
                        })
                    ),
                    level: 'warn',
                }),
            ],
        });
    }

    private formatLog(message: any, optionalParams: any[]) {
        const context = optionalParams.length > 0 ? optionalParams[optionalParams.length - 1] : undefined;
        const isContext = typeof context === 'string';

        return {
            message,
            context: isContext ? context : undefined,
            ...(!isContext && optionalParams.length > 0 ? { meta: optionalParams } : {}),
        };
    }

    log(message: any, ...optionalParams: any[]) {
        this.logger.info(this.formatLog(message, optionalParams));
    }

    error(message: any, ...optionalParams: any[]) {
        this.logger.error(this.formatLog(message, optionalParams));
        this.sendToDiscord('error', message, optionalParams);
    }

    warn(message: any, ...optionalParams: any[]) {
        this.logger.warn(this.formatLog(message, optionalParams));
        this.sendToDiscord('warn', message, optionalParams);
    }

    debug(message: any, ...optionalParams: any[]) {
        this.logger.debug(this.formatLog(message, optionalParams));
    }

    verbose(message: any, ...optionalParams: any[]) {
        this.logger.verbose(this.formatLog(message, optionalParams));
    }

    fatal(message: any, ...optionalParams: any[]) {
        this.logger.error(this.formatLog(message, optionalParams));
        this.sendToDiscord('fatal', message, optionalParams);
    }

    private async sendToDiscord(level: string, message: any, optionalParams: any[]) {
        if (!this.discordToken || !this.discordChannelId) {
            return;
        }

        try {
            const logData = this.formatLog(message, optionalParams);
            const embed = this.createDiscordEmbed(level, logData);

            // Add the embed to the queue
            await new Promise<void>((resolve) => {
                this.messageQueue.push({ embed, resolve });
                this.processQueue();
            });
        } catch (error) {
            // Log the error but don't throw to avoid infinite loops
            console.error('Failed to send Discord notification:', error);
        }
    }

    private async processQueue() {
        if (this.isProcessingQueue) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.messageQueue.length > 0) {
            const { embed, resolve } = this.messageQueue.shift()!;

            try {
                await this.sendDiscordEmbed(embed);
                resolve();
            } catch (error) {
                console.error('Failed to send Discord notification:', error);
                resolve();
            }

            // Delay for 5 seconds between messages
            await new Promise((res) => setTimeout(res, 5000));
        }

        this.isProcessingQueue = false;
    }

    private createDiscordEmbed(level: string, logData: any): any {
        const timestamp = new Date().toISOString();
        const color = this.getLevelColor(level);

        const embed = {
            title: `[${level.toUpperCase()}] Log Notification`,
            description: typeof logData.message === 'string' ? logData.message : JSON.stringify(logData.message),
            color: color,
            fields: [] as any[],
            timestamp: timestamp
        };

        if (logData.context) {
            embed.fields.push({
                name: 'Context',
                value: logData.context,
                inline: false
            });
        }

        if (logData.meta && logData.meta.length > 0) {
            embed.fields.push({
                name: 'Additional Info',
                value: `\`\`\`json\n${JSON.stringify(logData.meta, null, 2)}\n\`\`\``,
                inline: false
            });
        }

        return { embeds: [embed] };
    }

    private getLevelColor(level: string): number {
        switch (level) {
            case 'fatal':
                return 0xff0000; // Red
            case 'error':
                return 0xff4500; // Orange-Red
            case 'warn':
                return 0xffd700; // Gold
            case 'debug':
                return 0x1e90ff; // Dodger Blue
            case 'verbose':
                return 0x32cd32; // Lime Green
            default:
                return 0x808080; // Gray
        }
    }

    private async sendDiscordEmbed(embed: any) {
        await axios.post(
            `https://discord.com/api/v10/channels/${this.discordChannelId}/messages`,
            embed,
            {
                headers: {
                    'Authorization': `Bot ${this.discordToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}