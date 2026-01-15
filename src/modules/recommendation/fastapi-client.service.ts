import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { FastApiResponseDto } from './dto/fastApi-response.dto';
import { LoggingHandler } from '../logger/LoggingHandler';

interface FastApiRequestBody {
    interests: string;
    values: string;
    goals: string;
}

@Injectable()
export class FastApiClientService {
    private readonly logger = new Logger(FastApiClientService.name);
    private fastapiUrl: string;

    constructor() {
        const envUrl = process.env.FASTAPI_URL?.trim();
        if (!envUrl) {
            new LoggingHandler(this.logger, {
                level: 'error',
                codeLocation: 'constructor',
                message: "FASTAPI_URL environment variable is not set"
            }).send();
            throw new InternalServerErrorException('FASTAPI_URL environment variable is not set');
        }
        const baseUrl = envUrl.replace(/\/+$/, '');
        this.fastapiUrl = `${baseUrl}/recommendations`;
    }

    /**
     * Send a POST request to the FastAPI service to get module recommendations
     * @param interests - User's interests (semicolon-separated)
     * @param values - User's values/merits (semicolon-separated)
     * @param goals - User's goals (semicolon-separated)
     * @returns FastApiResponseDto with module recommendations
     */
    async getRecommendations(
        interests: string,
        values: string,
        goals: string,
    ): Promise<FastApiResponseDto> {
        const log = new LoggingHandler(this.logger, {
            level: 'debug',
            codeLocation: 'getRecommendations',
            userData: {
                requestInterests: interests,
                requestGoals: goals,
                requestMerits: values
            },
            debugObject: {
                FASTAPI_URL: this.fastapiUrl
            }
        });
        if (!this.fastapiUrl) {
            log.update("errorMessage", "FastAPI URL is not configured").update("level", "error").send();
            throw new InternalServerErrorException('FastAPI URL is not configured');
        }

        const requestBody: FastApiRequestBody = {
            interests,
            values,
            goals,
        };

        try {
            log.update("message", "Sending request to FastAPI").sendPartial();

            const response = await fetch(this.fastapiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                log.update("errorMessage", errorText)
                    .update("level", "error")
                    .update("httpResponse", response.status)
                    .update("programmerNote", "FastAPI request failed").send();
                throw new InternalServerErrorException(
                    'Failed to get recommendations from AI service',
                );
            }

            const data: FastApiResponseDto = await response.json();
            log.update("message", "Successfully received recommendations from FastAPI").send();

            return data;
        } catch (error) {
            log.update("errorMessage", error)
                .update("programmerNote", "Error calling FastAPI")
                .update("level", "error").send();
            if (error instanceof InternalServerErrorException) {
                throw error;
            }
            throw new InternalServerErrorException(
                'Unable to connect to AI recommendation service',
            );
        }
    }
}
