import { Context } from 'telegraf';

interface IBotSession {
    status: 'READY' | 'AWAITING_USER_CONTACTS';
    steps: string[];
}

export interface IBotWithSession extends Context {
    session?: IBotSession;
}