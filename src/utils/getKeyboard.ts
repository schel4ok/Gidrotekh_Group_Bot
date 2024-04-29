import { Markup } from 'telegraf';
import { BotNodeBtn } from '../interfaces';

export function getKeyboard(buttons: BotNodeBtn[]) {
    return Markup.inlineKeyboard(
        buttons.map(
            ({ id, label }) => [Markup.button.callback(label, id)]
        )
    );
}