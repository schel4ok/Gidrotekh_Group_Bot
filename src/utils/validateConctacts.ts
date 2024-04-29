import { UserContactsInput } from '../interfaces';

export function createContactsInput(inputText: string): UserContactsInput {
    try {
        const parsedInputs = inputText.split(',');
        return {
            name: parsedInputs[0].trim(),
            company: parsedInputs[1].trim(),
            phone: parsedInputs[2].trim()
        };
    } catch (error) {
        return {
            name: '',
            company: '',
            phone: ''
        }
    }
}

export function validateContactsInput(input: UserContactsInput): boolean {
    return (
        input.name.length > 0
        && input.company.length >= 0
        && (/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(input.phone))
    );
}