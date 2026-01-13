import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

export const INTEREST_MAX_LENGTH = 50;
export const MERIT_MAX_LENGTH = 50;
export const GOALS_MAX_LENGTH = 50;
export const MAX_INTERESTS_COUNT = 10;
export const MAX_MERITS_COUNT = 10;
export const MAX_GOALS_COUNT = 10;

// Pattern: letters (including accented), spaces, hyphens, and apostrophes
export const TEXT_ONLY_PATTERN = /^[a-zA-ZÀ-ÿ\s\-';]*$/;

interface PreferencesValidationConfig {
    maxItemLength: number;
    maxItemsCount: number;
    fieldName: string;
}

@ValidatorConstraint({ name: 'isSemicolonSeparatedPreferences', async: false })
class IsSemicolonSeparatedPreferencesConstraint implements ValidatorConstraintInterface {
    private config: PreferencesValidationConfig;

    constructor(config: PreferencesValidationConfig) {
        this.config = config;
    }

    validate(value: any): boolean {
        if (!value || typeof value !== 'string') {
            return false;
        }

        // Check if matches text only pattern
        if (!TEXT_ONLY_PATTERN.test(value)) {
            return false;
        }

        // Split by semicolon and filter out empty items
        const items = value.split(';').filter((item) => item.trim().length > 0);

        // Must have at least 1 item
        if (items.length === 0) {
            return false;
        }

        // Check count doesn't exceed max
        if (items.length > this.config.maxItemsCount) {
            return false;
        }

        // Check each item is within length constraints
        return items.every((item) => {
            const trimmed = item.trim();
            return trimmed.length >= 1 && trimmed.length <= this.config.maxItemLength;
        });
    }

    defaultMessage(): string {
        return `${this.config.fieldName} must be semicolon-separated values (e.g. value1;value2;value3;). ` +
               `Each item must be 1-${this.config.maxItemLength} characters, ` +
               `max ${this.config.maxItemsCount} items. Only letters, spaces, hyphens, and apostrophes allowed.`;
    }
}

export function IsSemicolonSeparatedPreferences(
    config: PreferencesValidationConfig,
    validationOptions?: ValidationOptions,
) {
    return function (target: Object, propertyName: string) {
        registerDecorator({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [config],
            validator: {
                validate(value: any, args: any): boolean {
                    const constraint = new IsSemicolonSeparatedPreferencesConstraint(args.constraints[0]);
                    return constraint.validate(value);
                },
                defaultMessage(args: any): string {
                    const constraint = new IsSemicolonSeparatedPreferencesConstraint(args.constraints[0]);
                    return constraint.defaultMessage();
                },
            },
        });
    };
}
