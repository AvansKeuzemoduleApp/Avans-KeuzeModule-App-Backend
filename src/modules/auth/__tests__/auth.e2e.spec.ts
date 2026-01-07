import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AuthModule } from '../auth.module';
import { UsersModule } from '../../users/users.module'
import { APP_GUARD } from '@nestjs/core';
import { JwtCookieAuthGuard } from '../guards/jwt-cookie.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { response } from 'express';

describe('Auth E2E Tests', () => {
    let app: INestApplication;
    let configService: ConfigService;
    
    // Cache test users to avoid redundant registrations
    const testUsers: { [key: string]: { email: string; password: string } } = {};

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env',
                }),
                TypeOrmModule.forRootAsync({
                    inject: [ConfigService],
                    useFactory: (config: ConfigService) => ({
                        type: 'mariadb',
                        host: config.get('DB_HOST') || 'localhost',
                        port: parseInt(config.get('DB_PORT') || '3306'),
                        username: config.get('DB_USER') || 'root',
                        password: config.get('DB_PASSWORD') || '',
                        database: config.get('DB_NAME') || 'keuzekompas_test',
                        autoLoadEntities: true,
                        synchronize: true,
                        dropSchema: true,
                        logging: false,
                    }),
                }),
                ThrottlerModule.forRoot([{
                    ttl: 10000,
                    limit: 100,
                }]),
                JwtModule.registerAsync({
                    inject: [ConfigService],
                    useFactory: (config: ConfigService) => ({
                        secret: config.get('JWT_SECRET'),
                        signOptions: {
                            expiresIn: `${config.get('ACCESS_TOKEN_EXPIRES_IN_SECONDS', '900')}s`,
                        },
                    }),
                }),
                AuthModule,
                UsersModule,
            ],
            providers: [
                { provide: APP_GUARD, useClass: ThrottlerGuard },
                { provide: APP_GUARD, useClass: JwtCookieAuthGuard }
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        configService = moduleFixture.get<ConfigService>(ConfigService);

        // Set trust proxy for IP extraction
        const expressApp = app.getHttpAdapter().getInstance();
        expressApp.set('trust proxy', 'loopback');

        app.use(cookieParser());
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    // Helper function to register or get cached user
    async function getOrRegisterUser(key: string, email: string, password: string) {
        if (!testUsers[key]) {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email, password })
                .expect(200);
            testUsers[key] = { email, password };
        }
        return testUsers[key];
    }

    describe('Full Auth Flow - E2E', () => {
        const testUser = {
            email: 'test@student.avans.nl',
            password: 'SecureP@ssw0rd!123',
        };

    it('Should complete full registration -> login -> refresh -> logout flow', async () => {
        // Step 1: Register
        let response = await request(app.getHttpServer())
            .post('/auth/register')
            .send(testUser)
            .expect(200);

        expect(response.body.message).toContain('registration');

        // Step 2: Login
        response = await request(app.getHttpServer())
            .post('/auth/login')
            .send(testUser)
            .expect(200);

        expect(response.body.message).toBe('Login Successful');

        // Extract Cookies
        const setCookieHeader = response.headers['set-cookie'];
        let accessToken: string = '';
        let refreshToken: string = '';

        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        cookies.forEach((cookie: string) => {
            if (cookie.includes('access_token')) {
                accessToken = cookie.split('access_token=')[1].split(';')[0];
            }
            if (cookie.includes('refresh_token')) {
                refreshToken = cookie.split('refresh_token=')[1].split(';')[0];
            }
        });

        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();

        // Step 3: Access protected endpoint with access token
        response = await request(app.getHttpServer())
            .get('/auth/me')
            .set('Cookie', [`access_token=${accessToken}`])
            .expect(200);

        // Endpoint should return user data
        expect(response.body).toBeDefined();

        // Step 4: Refresh Tokens
        response = await request(app.getHttpServer())
            .post('/auth/refresh')
            .set('Cookie', [`refresh_token=${refreshToken}`])
            .expect(200);
            
        expect(response.body.message).toBe('Refresh');

        // Extract new tokens
        const newSetCookieHeader = response.headers['set-cookie'];
        let newAccessToken: string = '';
        let newRefreshToken: string = '';

        const newCookies = Array.isArray(newSetCookieHeader) ? newSetCookieHeader : [newSetCookieHeader];
        newCookies.forEach((cookie: string) => {
            if (cookie.includes('access_token')) {
                newAccessToken = cookie.split('access_token=')[1].split(';')[0];
            }
            if (cookie.includes('refresh_token')) {
                newRefreshToken = cookie.split('refresh_token=')[1].split(';')[0];
            }
        });

        expect(newAccessToken).toBeDefined();
        expect(newRefreshToken).toBeDefined();

        // Step 5: Logout
        response = await request(app.getHttpServer())
            .post('/auth/logout')
            .set('Cookie', [`access_token=${newAccessToken}`, `refresh_token=${newRefreshToken}`])
            .expect(200);

        expect(response.body.message).toBe('Logged out');
    });

    it('Should prevent brute force attacks with exponetial backoff', async () => {
        const user = await getOrRegisterUser('brute-force', 'attacker@student.avans.nl', 'SecureP@ssw0rd!456');

        // Attempt 11 failed logins
        for (let i = 0; i < 11; i++) {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: user.email,
                    password: 'WrongP@ssw0rd!123',
                })
            .expect(401);

            // After 10 failures, should have Retry-After header
            if (i >= 10) {
                expect(response.headers['retry-after']).toBeDefined();
                const retryAfter = parseInt(response.headers['retry-after'], 10);

                expect(retryAfter).toBeGreaterThan(0);
                expect(retryAfter).toBeLessThanOrEqual(900); // Max 15 minutes
            }
        }
    });

    it('Should reset failure count on successful login', async () => {
        const user = await getOrRegisterUser('reset-test', 'resettest@student.avans.nl', 'SecureP@ssw0rd!789');

        // Attempt 5 failed logins
        for (let i = 0; i < 5; i++) {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: user.email, password: 'WrongP@ssw0rd!' })
                .expect(401);
        }

        // Now Login Successfully
        await request(app.getHttpServer())
            .post('/auth/login')
            .send(user)
            .expect(200);

        // Attempt another failed login - Should start fresh counter
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: user.email, password: 'WrongP@ssw0rd!' })
            .expect(401);

        // Should NOT have Retry-After header (only 1 failure)
        expect(response.headers['retry-after']).toBeUndefined();
    });

    it('Should handle account enumeration protection', async () => {
        // Register first user
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'registered@student.avans.nl',
                password: 'SecureP@ssw0rd!999',
            })
            .expect(200);

        // Try to register same email twice - Should return 200
        const response1 = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'registered@student.avans.nl',
                password: 'DifferentSecureP@ssw0rd!999',
            })
            .expect(200);

        // Try to register non-existent email - Should return 200
        const response2 = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'nonexistent@student.avans.nl',
                password: 'SecureP@ssw0rd!999',
            })
            .expect(200);

        // Both should have generic messages
        expect(response1.body.message).toBe(response2.body.message);
    });

    it('Should validate email format on registration', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'invalid-email',
                password: 'SecureP@ssw0rd!'
            })
            .expect(400);

        expect(response.body.message).toBeDefined();
    });

    it('Should enforce strong password policy on registration', async () => {
        // Test weak password
        const weakPassword = 'weak';
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'weakpassword@student.avans.nl',
                password: weakPassword
            })
            .expect(400);

        expect(response.body.message).toBeDefined();
    });

    it('Should require authentication for protected endpoints', async () => {
        // Try to access /auth/me without token
        await request(app.getHttpServer())
            .get('/auth/me')
            .expect(401);

        // Try with invalid token
        await request(app.getHttpServer())
            .get('/auth/me')
            .set('Cookie', ['access_token=invalidtoken'])
            .expect(401);
    });

    it('Should set secure httpOnly cookies', async () => {
        const user = await getOrRegisterUser('cookies', 'cookies@student.avans.nl', 'SecureP@ssw0rd!000');

        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send(user)
            .expect(200);

        const cookies = response.headers['set-cookie'];
        const cookieArray = Array.isArray(cookies) ? cookies : [cookies];

        // Verify HttpOnly flag
        expect(cookieArray.some((c: string) => c.includes('HttpOnly'))).toBe(true);

        // Verify SameSite flag
        expect(cookieArray.some((c: string) => c.includes('SameSite='))).toBe(true);

        // Verify Path for Access Token
        expect(cookieArray.some((c: string) => c.includes('access_token') && c.includes('Path=/'))).toBe(true);
        
        // Verify Path for Refresh Token
        expect(cookieArray.some((c: string) => c.includes('refresh_token') && c.includes('Path=/api/auth'))).toBe(true);
    });

    it('Should extract correct IP from X-Forwarded-For header', async () => {
        const user = await getOrRegisterUser('ip-test', 'ip@student.avans.nl', 'SecureP@ssw0rd!111');

        // Attempt failed login with X-Forwarded-For
        for (let i = 0; i < 11; i++) {
            await request(app.getHttpServer())
                .post('/auth/login')
                .set('X-Forwarded-For', '203.0.113.195, 70.41.3.18')
                .send({
                    email: user.email,
                    password: 'WrongP@ssw0rd!',
                })
                .expect(401);
        }

        // 11th request should have Retry-After
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .set('X-Forwarded-For', '203.0.113.195, 70.41.3.18')
            .send({ email: user.email, password: 'WrongP@ssw0rd!' })
            .expect(401);

        expect(response.headers['retry-after']).toBeDefined();
    });

    it.skip('Should record failures for all exception types (not just UnauthorizedException)', async () => {
        // Test validation error
        for (let i  = 0; i < 11; i++){
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'not-an-email', password: 'short' })
                .expect(400);
        }

        // 11th request should have Retry-After
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'not-an-email', password: 'short' })
            .expect(400);

        expect(response.headers['retry-after']).toBeDefined();
    });
    });
});
