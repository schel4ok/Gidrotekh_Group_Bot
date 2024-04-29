import { Telegraf } from 'telegraf';
import path from 'path';
import 'dotenv/config';
import 'reflect-metadata'
import LocalSession from 'telegraf-session-local';
import { IBotWithSession, BotNode } from './interfaces';
import { loadJsonData } from './utils/loadData';
import { getKeyboard } from './utils/getKeyboard';
import { validateNodeFlow } from './utils/validateNodes';
import { createContactsInput, validateContactsInput } from './utils/validateConctacts';

// Initialize the bot
const bot = new Telegraf<IBotWithSession>(process.env.TELEGRAM_TOKEN ?? 'badtoken');

// Enable session support
const localSession = new LocalSession();
bot.use(localSession.middleware());

async function setupBot(parentChatId: number) {
    try {
        const parentChannel = parentChatId;

        const dataPath = path.join(__dirname, 'data', 'data.json');
        const data = await loadJsonData(dataPath);

        const nodeFlow = await validateNodeFlow(data);

        bot.start(
            (ctx) => {
                const specialPeriod: [Date, Date] = [
                    // new Date('2024-04-28'), // Test check
                    new Date('2024-05-28'),
                    new Date('2024-05-31')
                ];
                const currentDate = new Date();

                // Prepare the node variable 
                let startNode: BotNode | undefined;

                // Set initial session state
                ctx.session = { status: 'READY', steps: [] };

                // If user starts conversation during the special period
                if (currentDate >= specialPeriod[0] && currentDate <= specialPeriod[1]) {
                    startNode = nodeFlow.getNodeById('SPECIAL');
                    // Change the status
                    ctx.session.status = 'AWAITING_USER_CONTACTS';
                }
                else {
                    startNode = nodeFlow.getNodeById('START');
                }

                if (!startNode)
                    throw new Error('Стартовый нод не обнаружен!');

                // Send start message based on the presence of the buttons
                ctx.reply(startNode.message, startNode.buttons ? getKeyboard(startNode.buttons) : undefined);
            });

        // SETUP BTN CALLBACK LISTENERS
        nodeFlow.getAllBtns().forEach(
            ({ id, label, targetNodeId }) => {
                // Subscribe to button id's (buttons emit their id's)
                bot.action(id, (ctx) => {
                    // Add selected option to the session steps (skipping return)
                    if (targetNodeId !== 'START') {
                        ctx.session!.steps.push(label);
                    }

                    // Send the user steps to the parent channel in the end
                    if (targetNodeId === 'FINISH') {
                        // Send the message
                        ctx.telegram.sendMessage(
                            parentChannel,
                            `Поступил запрос от @${ctx.from.username}[id:${ctx.from.id}] по [${ctx.session!.steps.join(' > ')}] ${new Date().toLocaleString()}`
                        )
                        // Clear the story
                        ctx.session!.steps = [];
                    }

                    // Update the message if there is next node
                    const nextNode = nodeFlow.getNodeById(targetNodeId);

                    if (nextNode) {
                        ctx.editMessageText(nextNode.message, nextNode.buttons ? getKeyboard(nextNode.buttons) : undefined);
                    }
                })
            }
        )

        // Add user input listener
        bot.use(async (ctx, next) => {
            if (!ctx.session || !ctx.message || !('text' in ctx.message))
                return next();

            switch (ctx.session.status) {
                case 'AWAITING_USER_CONTACTS':
                    const parsedInput = createContactsInput(ctx.message.text);

                    if (!validateContactsInput(parsedInput))
                        ctx.reply('Пожалуйста, введите ваши контакты в следующем формате: <ФИО>, <Компания>, <Телефон>.');
                    else {
                        ctx.reply('Спасибо за ваше сообщение, мы свяжемся с вами в самое ближайшее время!');
                        ctx.telegram.sendMessage(
                            parentChannel,
                            `Пользователь [${parsedInput.name}] из компании [${parsedInput.company}] оставил контактный телефон [${parsedInput.phone}] ${new Date().toLocaleString()}.`
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
        console.error('Запуск бота провалился: ', error);
    }
}

// Parent chat id to send messages to
const TARGET_CHAT_ID = -4137525849;
setupBot(TARGET_CHAT_ID);