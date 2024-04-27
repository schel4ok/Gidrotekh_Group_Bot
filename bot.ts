import { Telegraf } from 'telegraf';
import { BotFlow, BotNode } from './interfaces';
import { loadJsonData } from './utils/loadData';
import { getKeyboard } from './utils/getKeyboard';

const bot = new Telegraf(process.env.TELEGRAM_TOKEN ?? 'badtoken');

async function setupBot() {
    try {
        const dataFlow: BotFlow = await loadJsonData('./flowData.json');

        bot.start(
            (ctx) => {
                const isSpecial = true;
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
                ctx.reply(startFlow.message, getKeyboard(startFlow.buttons));
            });

        // Setup buttons
        Object
            .entries(dataFlow)
            .forEach(
                (([nodeKey, nodeValue]) => {
                    bot.action(nodeKey, (ctx) => {
                        ctx.editMessageText(nodeValue.message, getKeyboard(nodeValue.buttons))
                    });
                }));

        // Start the bot and signla
        await bot.launch();
        console.log('Bot started successfully!');
    } catch (error) {
        console.error('Failed to start the bot: ', error);
    }
}

setupBot();