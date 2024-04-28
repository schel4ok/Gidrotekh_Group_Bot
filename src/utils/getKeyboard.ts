import { Markup } from 'telegraf';

export function getKeyboard(options: Record<string, string>) {
    console.log(options);
    console.log(Object.entries(options));
    return Markup.inlineKeyboard(
        Object.entries(options).map(
            (([text, nextNode]) => Markup.button.callback(text, nextNode))
        )
    )
}