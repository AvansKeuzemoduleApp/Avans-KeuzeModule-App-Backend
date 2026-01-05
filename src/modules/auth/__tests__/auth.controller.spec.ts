import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../auth.controller'
import { AuthService } from '../auth.service';
import { LoginProtectionService } from '../login-protection/login-protection.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

describe('AuthController (Integration)', () => {
    let app: INestApplication;
    let authService: AuthService;
    let loginProtection: LoginProtectionService;

    // Mock Services
    const mockAuthService = {
        register: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        refresh: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => {
            const config = {
                AUTH_COOKIE_ACCESS: 'access_token',
                AUTH_COOKIE_REFRESH: 'refresh_token',
                COOKIE_SECURE: 'false',
                COOKIE_SAMESITE: 'lax',
                ACCESS_TOKEN_EXPIRES_IN_SECONDS: '900',
                REFRESH_TOKEN_EXPIRES_IN_SECONDS: '604800',
                NODE_ENV: 'test',
            };
            return config[key] ?? defaultValue;
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
                LoginProtectionService,
            ],
        }).compile();

        app = module.createNestApplication();
        app.use(cookieParser());
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();

        authService = module.get<AuthService>(AuthService);
        loginProtection = module.get<LoginProtectionService>(LoginProtectionService);
    });

    afterEach(async () => {
        jest.clearAllMocks();
        loginProtection['attempts'].clear();
        await app.close();
    });

    describe('POST /auth/register', () => {
        it('Should register a new user successfully', async () => {
            mockAuthService.register.mockResolvedValueOnce(undefined);

            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'test@student.avans.nl',
                    password: 'SecureP@ssw0rd!',
                })
                .expect(200);


            expect(response.body.message).toBe('If registration is possible, the account will be created.');
            expect(mockAuthService.register).toHaveBeenCalledWith({
                email: 'test@student.avans.nl',
                password: 'SecureP@ssw0rd!',
            });
        });

        it('Should validate email format', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'SecureP@ssw0rd!',
                })
                .expect(400);

                expect(mockAuthService.register).not.toHaveBeenCalled();
            });

        it('Should validate password strength', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'test@student.avans.nl',
                    password: 'weak',
                })
                .expect(400);

                expect(mockAuthService.register).not.toHaveBeenCalled();
            });

        it('Should retrun 200 even if email already exists (prevent enumeration)', async () => {
            mockAuthService.register.mockResolvedValueOnce(undefined);

            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'existing@student.avans.nl',
                    password: 'SecureP@ssw0rd!',
                })
                .expect(200);

                expect(response.body.message).toBe('If registration is possible, the account will be created.');
            });
        })
    });