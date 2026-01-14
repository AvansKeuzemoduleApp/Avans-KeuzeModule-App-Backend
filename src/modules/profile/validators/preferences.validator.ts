import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

export const INTEREST_MAX_LENGTH = 50;
export const MERIT_MAX_LENGTH = 50;
export const GOALS_MAX_LENGTH = 50;
export const MAX_INTERESTS_COUNT = 20;
export const MAX_MERITS_COUNT = 20;
export const MAX_GOALS_COUNT = 20;

// Pattern: letters (including accented), spaces, hyphens, and apostrophes (no semicolons)
export const TEXT_ONLY_PATTERN = /^[a-zA-ZÀ-ÿ\s\-']*$/;

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

        // Must end with semicolon
        if (!value.endsWith(';')) {
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

        // Validate each item individually
        return items.every((item) => {
            const trimmed = item.trim();
            
            // Check length constraints
            if (trimmed.length < 1 || trimmed.length > this.config.maxItemLength) {
                return false;
            }
            
            // Check if item matches text only pattern
            if (!TEXT_ONLY_PATTERN.test(trimmed)) {
                return false;
            }
            
            return true;
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
        const constraintInstance = new IsSemicolonSeparatedPreferencesConstraint(config);
        registerDecorator({
            target: target.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [config],
            validator: {
                validate(value: any): boolean {
                    return constraintInstance.validate(value);
                },
                defaultMessage(): string {
                    return constraintInstance.defaultMessage();
                },
            },
        });
    };
}
