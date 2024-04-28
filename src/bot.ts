import { Telegraf } from 'telegraf';
import path from 'path';
import 'dotenv/config';
import LocalSession from 'telegraf-session-local';
import { BotFlow, BotNode, BotWithSession } from './interfaces';
import { loadJsonData } from './utils/loadData';
import { getKeyboard } from './utils/getKeyboard';
import { validateContacts } from './utils/validateConctacts';

// Initialize the bot
const bot = new Telegraf<BotWithSession>(process.env.TELEGRAM_TOKEN ?? 'badtoken');

// Enable session support
const localSession = new LocalSession();
bot.use(localSession.middleware());

async function setupBot(parentChatId: number) {
    try {
        const parentChannel = parentChatId;
        const dataPath = path.join(__dirname, 'data', 'data.json');
        const dataFlow: BotFlow = await loadJsonData(dataPath);
        const answers = Object.values(dataFlow).filter(node => node.buttons);
        // console.log(answers);

        bot.start(
            (ctx) => {
                const specialPeriod: [Date, Date] = [
                    // new Date('2024-04-28'), // Test check
                    new Date('2024-05-28'),
                    new Date('2024-05-31')
                ];
                let startFlow: BotNode;
                const currentDate = new Date();
                // Set initial status
                ctx.session = { status: 'READY', steps: [] };

                // If user starts conversation during the special period
                if (currentDate >= specialPeriod[0] && currentDate <= specialPeriod[1]) {
                    startFlow = dataFlow['special'];
                    // Change the status
                    ctx.session.status = 'AWAITING_USER_CONTACTS';
                }
                else {
                    startFlow = dataFlow['start'];
                }

                if (!startFlow || !startFlow.message)
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
                        bot.action(nodeKey, (ctx) => {
                            console.log('Node key - ', nodeKey);
                            // Add user choice to the history (skip return to the start)
                            if (nodeKey !== 'start' && nodeKey !== 'finish')
                                ctx.session!.steps.push(nodeKey);

                            if (nodeKey === 'finish') {
                                // Send the message
                                ctx.telegram.sendMessage(
                                    parentChannel,
                                    `Поступил запрос от @${ctx.from.username}(id:${ctx.from.id}) по ${ctx.session!.steps.join(' > ')}`
                                )
                                // Clear the story
                                ctx.session!.steps = [];
                            }

                            // Update the message
                            ctx.editMessageText(nodeValue.message, getKeyboard(nodeValue.buttons));
                        });
                    }
                )
            );

        // Add user input listener
        bot.use(async (ctx, next) => {
            if (!ctx.session || !ctx.message || !('text' in ctx.message))
                return next();

            switch (ctx.session.status) {
                case 'AWAITING_USER_CONTACTS':
                    const validInput = validateContacts(ctx.message.text);

                    if (!validInput)
                        ctx.reply('Пожалуйста, введите ваши контакты в следующем формате: <ФИО>, <Компания>, <Телефон>');
                    else {
                        ctx.reply('Спасибо за ваше сообщение, мы свяжемся с вами в самое ближайшее время!');
                        ctx.telegram.sendMessage(
                            parentChannel,
                            `Пользователь <${validInput.name}> из компании <${validInput.company}> оставил контактный телефон <${validInput.phone}> ${new Date().toLocaleString()}.`
                        );
                        // Reset status to disable listener
                        ctx.session.status = 'READY';
                    }
                    break;
                default:
                    ctx.reply('Запрос не распознан, пожалуйста, уточните запрос бота или свяжитесь с нами напрямую.');
            }

        })

        // Start the bot and signla
        await bot.launch();
    } catch (error) {
        console.error('Failed to start the bot: ', error);
    }
}

// Parent chat id to send messages to
const TARGET_CHAT_ID = -4171928290;
setupBot(TARGET_CHAT_ID);