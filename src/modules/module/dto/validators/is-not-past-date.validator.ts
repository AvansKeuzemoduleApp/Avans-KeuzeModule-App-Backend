import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

function toYyyyMmDd(value: unknown): string | null {
    if (typeof value !== 'string')
        return null;
    
    const s = value.trim();
    const datePart = s.length >= 10 ? s.slice(0, 10) : s;
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) 
        return null;
    
    return datePart;
}

function todayYyyyMmDd(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export function IsNotPastDate(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isNotPastDate',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown, _args: ValidationArguments) {
                    // If undefined/null, let other decorators handle requiredness.
                    if (value === undefined || value === null) 
                        return true;

                    const datePart = toYyyyMmDd(value);
                    if (!datePart) 
                        return false;

                    // Lexicographic compare works for YYYY-MM-DD.
                    return datePart >= todayYyyyMmDd();
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be today or a future date`;
                },
            },
        });
    };
}
