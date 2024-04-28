import { Markup } from 'telegraf';

export function getKeyboard(options: Record<string, string>) {
    return Markup.inlineKeyboard(
        Object.entries(options).map(
            (([text, nextNode]) => [Markup.button.callback(text, nextNode)])
        )
    );
}