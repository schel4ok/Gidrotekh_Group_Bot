import { Context } from 'telegraf';

export interface BotNode {
    message: string;
    buttons: Record<string, string>;
}

export interface BotFlow {
    [key: string]: BotNode;
}

export interface UserContactsInput {
    name: string;
    company: string;
    phone: string;
}

interface IBotSession {
    status: 'READY' | 'AWAITING_USER_CONTACTS';
    steps: string[];
}

export interface BotWithSession extends Context {
    session?: IBotSession;
}