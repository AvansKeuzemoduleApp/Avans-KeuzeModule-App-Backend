import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

function containsHtmlTag(value: string): boolean {
    return /<\s*\/?\s*[a-zA-Z][^>]*>/.test(value);
}

export function IsNotHtml(validationOptions?: ValidationOptions) {
    return (object: object, propertyName: string) => {
        registerDecorator({
            name: 'isNotHtml',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown) {
                    if (value === null || value === undefined) 
                        return true;
                    if (typeof value !== 'string')
                        return false;
                    
                    return !containsHtmlTag(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must not contain HTML`;
                },
            },
        });
    };
}