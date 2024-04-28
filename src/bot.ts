import { Telegraf } from 'telegraf';
import { BotFlow, BotNode } from './interfaces/interfaces';
import { loadJsonData } from './utils/loadData';
import { getKeyboard } from './utils/getKeyboard';
import 'dotenv/config';
import path from 'path';

const bot = new Telegraf(process.env.TELEGRAM_TOKEN ?? 'badtoken');

async function setupBot() {
    try {
        const dataPath = path.join(__dirname, 'data', 'data.json');
        const dataFlow: BotFlow = await loadJsonData(dataPath);

        bot.start(
            (ctx) => {
                const isSpecial = false;
                let startFlow: BotNode;

                if (isSpecial) {
                    startFlow = dataFlow['special'];
                }
                else {
                    startFlow = dataFlow['start'];
                }

                if (!startFlow)
                    throw new Error('Could not find the starter node!');

                // Setup message
                if (!startFlow.buttons)
                    ctx.reply(startFlow.message);
                else
                    ctx.reply(startFlow.message, getKeyboard(startFlow.buttons));
            });

        // Setup button listeners to react to btn plates
        Object
            .entries(dataFlow)
            .forEach(
                (
                    ([nodeKey, nodeValue]) => {
                        bot.action(nodeKey, (ctx) => ctx.editMessageText(nodeValue.message, getKeyboard(nodeValue.buttons)));
                    }
                ));

        // Start the bot and signla
        await bot.launch();
    } catch (error) {
        console.error('Failed to start the bot: ', error);
    }
}

setupBot();