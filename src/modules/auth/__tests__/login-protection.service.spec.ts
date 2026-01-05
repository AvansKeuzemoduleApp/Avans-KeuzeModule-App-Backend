import { Test, TestingModule } from '@nestjs/testing';
import { LoginProtectionService } from '../login-protection/login-protection.service'

describe('LoginProtectionService', () => {
    let service: LoginProtectionService;

    beforeEach(async() => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LoginProtectionService],
        }).compile();
    
        service = module.get<LoginProtectionService>(LoginProtectionService);
    });

    afterEach(() => {
        // Clear all rate limiting data between tests
        service['attempts'].clear();
    });

    describe('makeKey', () => {
        it('Should create a key from IP address', () => {
            const key = service.makeKey('192.168.1.1');
            expect(key).toBe('login_192.168.1.1');
        });

        it('Should handle IPv6 addresses', () => {
            const key = service.makeKey('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
            expect(key).toBe('login_2001:0db8:85a3:0000:0000:8a2e:0370:7334');
        });
    });

    describe('recordFailure', () => {
        it('Should record first failure', () => {
            const key = service.makeKey('192.168.1.1');
            service.recordFailure(key);

            const entry = service['attempts'].get(key);
            expect(entry).toBeDefined();
            expect(entry!.count).toBe(1);
            expect(entry!.firstFailAt).toBeLessThanOrEqual(Date.now());
        });

        it('Should increment failure count', () => {
            const key = service.makeKey('192.168.1.1');

            service.recordFailure(key);
            service.recordFailure(key);
            service.recordFailure(key);

            const entry = service['attempts'].get(key);
            expect(entry!.count).toBe(3);
        });

        it('Should reset count after window expires', () => {
            const key = service.makeKey('192.168.1.1');

            // Record initial failure
            service.recordFailure(key);

            // Simulate time passing
            const entry = service['attempts'].get(key);
            const oldFirstFailAt = Date.now() - (16 * 60 * 1000);
            entry!.firstFailAt = oldFirstFailAt;

            // Record new failure - should reset count
            service.recordFailure(key);

            const updatedEntry = service['attempts'].get(key);
            expect(updatedEntry).toBeDefined();
            expect(updatedEntry!.count).toBe(1);
            expect(updatedEntry!.firstFailAt).toBeGreaterThan(oldFirstFailAt);
        });
    });

    describe('getBackoff', () => {
        it('Should return 0 backoff for attempts below threshold', () => {
            const key = service.makeKey('192.168.1.1');

            // Record 9 failures (threshold is 10)
            for (let i = 0; i < 9; i++){
                service.recordFailure(key);
            }

            const backoff = service.getBackoff(key);
            expect(backoff).toBe(0);
        });

        it('Should return exponential backoff after threshold', () => {
            const key = service.makeKey('192.168.1.1');

            // Record 11 failures (threshold is 10)
            for (let i = 0; i < 11; i++){
                service.recordFailure(key);
            }

            const backoff = service.getBackoff(key);
            expect(backoff).toBe(2000);
        });

        it('Should cap backoff at window duration', () => {
            const key = service.makeKey('192.168.1.1');

            // Record 30 failures (would be 2^20 seconds without cap)
            for (let i = 0; i < 30; i++){
                service.recordFailure(key);
            }

            const backoff = service.getBackoff(key);
            const windowMs = 15 * 60 * 1000;
            expect(backoff).toBe(windowMs);
        });

        it('Should return 0 for non-existent keys', () => {
            const key = service.makeKey('192.168.1.1');
            const backoff = service.getBackoff(key);
            expect(backoff).toBe(0);
        });
    });

    describe('recordSuccess', () => {
        it('Should clear failure count on successful login', () => {
            const key = service.makeKey('192.168.1.1');

            // Record Failures
            for (let i = 0; i < 5; i++){
                service.recordFailure(key);
            }

            expect(service['attempts'].has(key)).toBe(true);

            // Successful Login
            service.recordSuccess(key);

            expect(service['attempts'].has(key)).toBe(false);
        });
    });

    describe('check', () => {
        it('Should return key and backoff time', () => {
            const ip = '192.168.1.1';

            // Record 11 failures
            for (let i = 0; i < 11; i++){
                service.recordFailure(service.makeKey(ip));
            }

            const result = service.check(ip);

            expect(result.key).toBe('login_192.168.1.1');
            expect(result.backoffMs).toBe(2000);
        });
    });

    describe('reset', () => {
        it('Should remove entry completely', () => {
            const key = service.makeKey('192.168.1.1');

            service.recordFailure(key);
            expect(service['attempts'].has(key)).toBe(true);

            service.reset(key);
            expect(service['attempts'].has(key)).toBe(false);
        });
    });

    describe('sleep', () => {
        it('Should return immediately (no-op)', async () => {
            const start = Date.now();
            await service.sleep(5000);
            const duration = Date.now() - start;

            // Should complete almost instantly
            expect(duration).toBeLessThan(100);
        });
    });
});