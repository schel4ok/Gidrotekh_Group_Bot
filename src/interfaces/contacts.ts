import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

interface IUserContactsInput {
    name: string;
    company: string;
    phone: string;
}

export class UserContactsInput implements IUserContactsInput {
    @Expose()
    @IsNotEmpty()
    @IsString()
    name: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    company: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    phone: string;
}