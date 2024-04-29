import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

interface IBotNodeBtn {
    id: string;
    label: string;
    targetNodeId: string;
}

interface IBotNode {
    id: string;
    message: string;
    buttons?: IBotNodeBtn[];
}

interface IBotFlow {
    nodes: IBotNode[];
    getNodeById: (nodeId: string) => IBotNode | undefined;
    getBtnById: (btnId: string) => IBotNodeBtn | undefined;
}

export class BotNodeBtn implements IBotNodeBtn {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    label: string;

    @IsNotEmpty()
    @IsString()
    targetNodeId: string;
}

export class BotNode implements IBotNode {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    message: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BotNodeBtn)
    buttons?: IBotNodeBtn[];
}

export class BotFlow implements IBotFlow {
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BotNode)
    nodes: IBotNode[];

    getNodeById = (nodeId: string): IBotNode | undefined => {
        return this.nodes.find(node => node.id === nodeId);
    };

    getBtnById = (btnId: string): IBotNodeBtn | undefined => {
        const buttons = this.nodes.reduce<IBotNodeBtn[]>(
            (btnsArr, node) => {
                // If there are buttons in the node, add them to the array
                if (node.buttons)
                    btnsArr.push(...node.buttons);

                return btnsArr;
            }, []
        );

        return buttons.find(btn => btn.id === btnId);
    };
}