import { Context } from 'telegraf';
import { UserContactsInput } from './contacts';

export interface IBotSession {
    status: 'READY' | 'AWAITING_USER_NAME' | 'AWAITING_USER_COMPANY' | 'AWAITING_USER_PHONE';
    steps: string[];
    contacts: UserContactsInput;
}

export interface IBotWithSession extends Context {
    session?: IBotSession;
}