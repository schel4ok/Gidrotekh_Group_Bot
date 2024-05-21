import { Context, Telegraf } from 'telegraf';
import RedisSession from 'telegraf-session-redis';
import path from 'path';
import 'dotenv/config';
import 'reflect-metadata'
import { IBotWithSession, IBotSession, BotNode } from './interfaces';
import {
    createContactsInput,
    getKeyboard,
    loadJsonData,
    validateCompany,
    validateName,
    validateNodeFlow,
    validatePhone
} from './utils';

// Initialize the bot
const bot = new Telegraf<IBotWithSession>(process.env.TELEGRAM_TOKEN ?? 'badtoken');

// Create a redis session
const redisSession = new RedisSession({
    store: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '0', 10) || 6379,
    },
});

// Enable session support
bot.use(redisSession.middleware());

// Setup the bot
async function setupBot(parentChatId: number) {
    try {
        const parentChannel = parentChatId;

        const dataPath = path.join(__dirname, 'data', 'data.json');
        const data = await loadJsonData(dataPath);

        const nodeFlow = await validateNodeFlow(data);
        const defaultSession: IBotSession = { status: 'READY' as const, steps: [], contacts: createContactsInput() }

        // Start message handler
        bot.start(
            (ctx) => {
                const specialPeriod: [Date, Date] = [
                    new Date('2024-05-28'),
                    new Date('2024-05-31')
                ];
                const currentDate = new Date();

                // Prepare the node variable 
                let startNode: BotNode | undefined;

                // Set initial session state
                ctx.session = { ...defaultSession };

                // If user starts conversation during the special period
                if (currentDate >= specialPeriod[0] && currentDate <= specialPeriod[1]) {
                    startNode = nodeFlow.getNodeById('SPECIAL');
                }
                else {
                    startNode = nodeFlow.getNodeById('START');
                }

                if (!startNode)
                    throw new Error('Стартовый нод не обнаружен!');

                // Send start message based on the presence of the buttons
                ctx.reply(startNode.message, startNode.buttons ? getKeyboard(startNode.buttons) : undefined);
            });

        // Setup btn callback listeners
        nodeFlow.getAllBtns().forEach(
            ({ id, label, targetNodeId }) => {
                // Subscribe to button id's (buttons emit their id's)
                bot.action(id, (ctx) => {
                    // Handle missing session
                    if (!ctx.session
                        || !ctx.session.status
                        || !ctx.session.contacts
                        || !ctx.session.status
                    ) ctx.session = { ...defaultSession };

                    // Add selected option to the session steps (skipping return)
                    if (targetNodeId !== 'START') {
                        ctx.session!.steps.push(label);
                    }

                    // Reset session
                    if (targetNodeId === 'START' || targetNodeId === 'SPECIAL') {
                        ctx.session = { ...defaultSession };
                    }

                    // Send the user steps to the parent channel in the end
                    if (targetNodeId === 'FINISH') {
                        // Send the message
                        ctx.telegram.sendMessage(
                            parentChannel,
                            `Поступил запрос от [<a href="tg://user?id=${ctx.from.id}">${ctx.from.username ?? 'user'}</a>] по [${ctx.session!.steps.join(' > ')}] ${new Date().toLocaleString()}`,
                            { parse_mode: 'HTML' }
                        )

                        // Clear the story
                        ctx.session = { ...defaultSession };
                    }

                    if (targetNodeId === 'REQUEST_CONTACTS') {
                        // Send inquiry
                        ctx.telegram.sendMessage(
                            parentChannel,
                            `Поступил запрос с выставки СТТ от [<a href="tg://user?id=${ctx.from.id}">${ctx.from.username ?? 'Аноним'}</a>] ${new Date().toLocaleString()}`,
                            { parse_mode: 'HTML' }
                        );
                    }

                    if (targetNodeId === 'REQUEST_NAME') {
                        // Change the status and wait for the input
                        ctx.session!.status = 'AWAITING_USER_NAME';
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
            if (!ctx.session || !ctx.message || !('text' in ctx.message) || !ctx.from || !('id' in ctx.from))
                return next();

            switch (ctx.session.status) {
                case 'AWAITING_USER_NAME':
                    // Validate name
                    if (!validateName(ctx.message.text)) {
                        ctx.reply('Пожалуйста, не оставляйте поле пустым!');
                        return next();
                    }

                    // Save user name
                    ctx.session.contacts.name = ctx.message.text;

                    // Send next query
                    ctx.reply(
                        nodeFlow.getNodeById('REQUEST_COMPANY')?.message ?? 'Следующий вопрос'
                    );

                    // Change state
                    ctx.session.status = 'AWAITING_USER_COMPANY';

                    break;

                case 'AWAITING_USER_COMPANY':
                    // Validate company
                    if (!validateCompany(ctx.message.text)) {
                        ctx.reply('Пожалуйста, не оставляйте поле пустым!');
                        return next();
                    }

                    // Save user company
                    ctx.session.contacts.company = ctx.message.text ?? 'Не указано';

                    // Send next query
                    ctx.reply(
                        nodeFlow.getNodeById('REQUEST_PHONE')?.message ?? 'Следующий вопрос'
                    );

                    // Change state
                    ctx.session.status = 'AWAITING_USER_PHONE';

                    break;

                case 'AWAITING_USER_PHONE':
                    // Validate phone
                    if (!validatePhone(ctx.message.text)) {
                        ctx.reply('Пожалуйста, укажите корректный номер телефона!');
                        return next();
                    }

                    // Save user phone
                    ctx.session.contacts.phone = ctx.message.text ?? 'Не указано';

                    // Send user data to the parent group
                    ctx.telegram.sendMessage(
                        parentChannel,
                        `Участник выставки СТТ [<a href="tg://user?id=${ctx.from.id}">${ctx.from.username ?? 'аноним'}</a>] предоставил контактную информацию [ФИО: ${ctx.session.contacts.name}, Компания: ${ctx.session.contacts.company}, Телефон: ${ctx.session.contacts.phone}] ${new Date().toLocaleString()}`,
                        { parse_mode: 'HTML' }
                    )

                    // Send confirmation message to the user
                    const thankyouNode = nodeFlow.getNodeById('THANK_YOU');
                    ctx.reply(
                        thankyouNode?.message
                        ?? 'Спасибо за ваше сообщение, мы свяжемся с вами в самое ближайшее время!',
                        thankyouNode && thankyouNode.buttons ? getKeyboard(thankyouNode.buttons) : undefined
                    );

                    // Change state
                    ctx.session = { ...defaultSession };

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
const TARGET_CHAT_ID = parseInt(process.env.PARENT_CHAT_ID ?? '');
setupBot(TARGET_CHAT_ID);