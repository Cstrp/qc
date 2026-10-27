import * as winston from 'winston';
import 'winston-daily-rotate-file';

const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'cyan',
        verbose: 'blue',
        debug: 'magenta',
        silly: 'grey',
    },
};

winston.addColors(customLevels.colors);

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, context, trace }) => {
        const contextStr = context ? `[${context}]` : '[App]';
        const traceStr = trace ? `\n  Stack: ${JSON.stringify(trace, null, 2)}` : '';

        return `${timestamp} ${contextStr} ${level}: ${message}${traceStr}`;
    }),
);

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
);

const transports: winston.transport[] = [
    new winston.transports.Console({
        level: 'debug',
        format: consoleFormat,
    }),
    new winston.transports.DailyRotateFile({
        filename: 'logs/app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'info',
        format: fileFormat,
        createSymlink: true,
        symlinkName: 'app-current.log',
    }),

    new winston.transports.DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: fileFormat,
    }),
];

export const logger = winston.createLogger({
    levels: customLevels.levels,
    defaultMeta: { service: 'nestjs-app' },
    transports,
});
