export interface BotNode {
    message: string;
    buttons: Record<string, string>;
}

export interface BotFlow {
    [key: string]: BotNode;
}
