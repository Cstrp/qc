import { join } from 'path';
import { cwd } from 'process';

export const uploadDirectory = join(cwd(), 'public');
