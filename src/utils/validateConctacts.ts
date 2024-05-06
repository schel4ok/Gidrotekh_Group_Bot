import { UserContactsInput } from '../interfaces';

export function createContactsInput(): UserContactsInput {
    return {
        name: '',
        company: '',
        phone: ''
    }
}

export function validateName(name: unknown): boolean {
    return typeof name === 'string'
        && name.length > 0;
}

export function validateCompany(company: unknown): boolean {
    return typeof company === 'string'
        && company.length > 0;
}

export function validatePhone(phone: unknown): boolean {
    return typeof phone === 'string'
        && (/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone))
}
