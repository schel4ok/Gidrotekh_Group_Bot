import { Expose, Type } from 'class-transformer';
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
    @Expose()
    @IsNotEmpty()
    @IsString()
    id: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    label: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    targetNodeId: string;
}

export class BotNode implements IBotNode {
    @Expose()
    @IsNotEmpty()
    @IsString()
    id: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    message: string;

    @Expose()
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BotNodeBtn)
    buttons?: IBotNodeBtn[];
}

export class BotFlow implements IBotFlow {
    @Expose()
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