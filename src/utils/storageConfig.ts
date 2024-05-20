import LocalSession, { LocalSessionOptions } from 'telegraf-session-local';
import { IBotSession } from '../interfaces';

export const sessionOptions: LocalSessionOptions<IBotSession> = {
    database: 'sessions.json',
    storage: LocalSession.storageFileAsync,
    format: {
        serialize: obj => JSON.stringify(obj, null, 2),
        deserialize: str => JSON.parse(str)
    },
    property: 'session',
    getSessionKey: (ctx) => {
        if (ctx.from && ctx.chat) {
            return `${ctx.from.id}:${ctx.chat.id}`;
        }

        if (ctx.from && ctx.inlineQuery) {
            return `${ctx.from.id}:${ctx.from.id}`;
        }

        if (ctx.from) {
            return `${ctx.from.id}:OTHER`
        }

        return `OTHER:${new Date().getTime()}`;
    }
}