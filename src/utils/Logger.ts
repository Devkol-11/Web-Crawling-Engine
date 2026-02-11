import winston from 'winston';
import AppConfig from '../config/index.js';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, label }) => {
    const tag = label ? `[${label}]` : '';
    return `${timestamp} ${level} ${tag} ${message}`;
});

export class Logger {
    private static instances = new Map<string, Logger>();
    private logger: winston.Logger;

    private constructor(label: string) {
        this.logger = winston.createLogger({
            level: AppConfig.logLevel,
            format: combine(
                timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                logFormat
            ),
            defaultMeta: { label },
            transports: [
                new winston.transports.Console({
                    format: combine(colorize(), logFormat)
                })
            ]
        });
    }

    /**
     * Factory method — returns a singleton Logger per label.
     */
    public static create(label: string): Logger {
        if (!Logger.instances.has(label)) {
            Logger.instances.set(label, new Logger(label));
        }
        return Logger.instances.get(label)!;
    }

    public info(message: string, ...meta: unknown[]): void {
        this.logger.info(message, ...meta);
    }

    public warn(message: string, ...meta: unknown[]): void {
        this.logger.warn(message, ...meta);
    }

    public error(message: string, ...meta: unknown[]): void {
        this.logger.error(message, ...meta);
    }

    public debug(message: string, ...meta: unknown[]): void {
        this.logger.debug(message, ...meta);
    }
}
