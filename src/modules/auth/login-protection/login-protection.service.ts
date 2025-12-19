import { Injectable, HttpException, HttpStatus } from '@nestjs/common'

type Entry = {
    fails: number;
    firstFailAt: number;
    lockUntil: number;
};


@Injectable()
export class LoginProtectionService {
    private readonly attempts = new Map<string, Entry>();

    private readonly windomMs = 15 * 60 * 1000;
    private readonly lockAfterFails = 10;
    private readonly lockMs = 15 * 60 * 1000;

    private makeKey(ip: string, email?: string) {
        return ip;
    }

    check(ip: string): { key: string; backoffMs: number} {
        const key = this.makeKey(ip);
        const now = Date.now();
        const entry = this.attempts.get(key);

        if (!entry)
            return { key, backoffMs: 0 };

        // Window Expire -> Reset
        if (now - entry.firstFailAt > this.windomMs) {
            this.attempts.delete(key);
            return { key, backoffMs: 0 };
        }

        // Locked
        if (entry.lockUntil > now) {
            throw new HttpException('Too many login attempts', HttpStatus.TOO_MANY_REQUESTS);
        }

        // Backoff Steps (ms)
        const steps = [0, 200, 400, 800, 1600, 2000];
        const backoffMs = steps[Math.min(entry.fails, steps.length - 1)];

        return { key, backoffMs };
    }

    recordFailure(key: string) {
        const now = Date.now();
        const entry = this.attempts.get(key);

        if (!entry || now - entry.firstFailAt > this.windomMs) {
            this.attempts.set(key, { fails: 1, firstFailAt: now, lockUntil: 0 });
            return;
        }

        entry.fails += 1;

        if (entry.fails >= this.lockAfterFails) {
            entry.lockUntil = now + this.lockMs;
        }
    }

    recordSuccess(key: string) {
        this.attempts.delete(key);
    }

    async sleep(ms: number) {
        if (ms <= 0)
            return;

        await new Promise((r) => setTimeout(r, ms));
    }
}