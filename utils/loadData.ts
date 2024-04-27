import { promises as fsPromises } from 'fs';

export async function loadJsonData(filePath: string): Promise<any> {
    try {
        const data = await fsPromises.readFile(filePath, { encoding: 'utf8' });

        return JSON.parse(data);
    } catch (error) {
        console.log('Failed to load JSON data!');
        throw error;
    }
}