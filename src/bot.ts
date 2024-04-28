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
        console.log(dataFlow['start'])
        bot.start(
            (ctx) => {
                const isSpecial = false;
                let startFlow: BotNode;
                console.log('Start init');
                if (isSpecial) {
                    startFlow = dataFlow['special'];
                    console.log('start flow special block');
                }
                else {
                    startFlow = dataFlow['start'];
                    console.log('start flow normal start block')
                }
                console.log('before err check');
                if (!startFlow)
                    throw new Error('Could not find the starter node!');
                console.log('before reply'); console.log(startFlow)

                // Setup message
                if (!startFlow.buttons)
                    ctx.reply(startFlow.message);
                else
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