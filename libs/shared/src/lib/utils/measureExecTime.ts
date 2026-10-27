import { logger } from './winston';

export const measureExecTime = async (cb: () => Promise<void>, description: string) => {
    logger.info(`⏱️ Starting task: ${description}...`);
    const start = performance.now();

    await cb();

    const end = performance.now();
    const duration = (end - start) / 1000;

    logger.info(`⏱️ Task "${description}" completed in ${duration.toFixed(2)}s.`);
};
