export function sanitizeText(value: string): string;
export function sanitizeText(value: unknown): unknown;
export function sanitizeText(value: unknown): unknown {
    if (typeof value !== 'string') return value;

    return value
        .replace(/\r\n/g, '\n')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim();
}

export function sanitizeTextArray(value: string[]): string[];
export function sanitizeTextArray(value: unknown): unknown;
export function sanitizeTextArray(value: unknown): unknown {
    if (!Array.isArray(value)) return value;

    return value.map((item) => {
        const cleaned = sanitizeText(item);
        return typeof cleaned === 'string' ? cleaned : String(item);
    });
}

export function sanitizeTags(tags: string[]): string[] {
    const cleaned = tags
        .map((t) => sanitizeText(String(t)))
        .filter((t): t is string => typeof t === 'string' && t.length > 0);

    return Array.from(new Set(cleaned));
}
