import { createHash } from 'crypto';

export const generateHash = (buffer: Buffer | string): string =>
    createHash('sha256').update(buffer).digest('hex');
