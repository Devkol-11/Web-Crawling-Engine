import dotenv from 'dotenv';

dotenv.config();

export interface IAppConfig {
    readonly port: number;
    readonly nodeEnv: string;
    readonly mongoUri: string;
    readonly redisUrl: string;
    readonly logLevel: string;
}

const AppConfig: IAppConfig = Object.freeze({
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri:
        process.env.MONGO_URI ||
        'mongodb://localhost:27017/webcrawl',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    logLevel: process.env.LOG_LEVEL || 'info'
});

export default AppConfig;
