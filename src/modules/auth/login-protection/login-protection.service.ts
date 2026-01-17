import { Injectable } from '@nestjs/common'

type Entry = {
    count: number;
    firstFailAt: number;
};

@Injectable()
export class LoginProtectionService {
    private readonly attempts = new Map<string, Entry>();
    private readonly windowMs = 15 * 60 * 1000;
    private readonly lockAfterFails = 10;

    makeKey(ip: string, scope: string = 'login'): string {
        return `${scope}_${ip}`;
    }

    check(ip: string, scope: string = 'login'): { key: string; backoffMs: number } {
        const key = this.makeKey(ip, scope);
        const backoffMs = this.getBackoff(key);
        return { key, backoffMs };
    }

    recordSuccess(key: string): void {
        this.attempts.delete(key);
    }

    recordFailure(key: string): void {
        const entry = this.attempts.get(key);
        const now = Date.now();

        if (!entry) {
            this.attempts.set(key, {
                count: 1,
                firstFailAt: now,
            });
            return;
        }

        if (now - entry.firstFailAt > this.windowMs) {
            entry.count = 1;
            entry.firstFailAt = now;
            return;
        }

        entry.count += 1;
    }

    getBackoff(key: string): number {
        const entry = this.attempts.get(key);

        if (!entry || entry.count < this.lockAfterFails)
            return 0;


        // Exponential Backoff: 2^(attempts - lockAfterFails) seconds
        // Example: lockAfterFails=10, attempts = 11 => 2^1 = 2 seconds
        const exponentialMs = Math.pow(2, entry.count - this.lockAfterFails) * 1000;

        return Math.min(exponentialMs, this.windowMs);
    }

    sleep(ms: number): Promise<void> {
        // Enforce backoff on client side
        return Promise.resolve();
    }

    reset(key: string): void {
        this.attempts.delete(key);
    }
}
