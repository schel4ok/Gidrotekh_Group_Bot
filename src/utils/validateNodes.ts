import { plainToClass } from 'class-transformer';
import { BotFlow } from '../interfaces/nodes';
import { validate } from 'class-validator';

export async function validateNodeFlow(data: unknown): Promise<BotFlow> {
    const nodeFlow = plainToClass(BotFlow, data, { excludeExtraneousValues: true });
    const errors = await validate(nodeFlow);

    if (errors.length > 0) {
        throw new Error(`Can't construct the bot data flow from the passed data. \n ${errors.join(';\n')}`);
    }

    return nodeFlow;
}