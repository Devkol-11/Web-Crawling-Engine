import { createClient, RedisClientType } from 'redis';
import { IUrlFrontier } from './interfaces/IUrlFrontier.js';
import { Logger } from '../utils/Logger.js';

const QUEUE_KEY = 'crawler:frontier:queue';
const VISITED_KEY = 'crawler:frontier:visited';

/**
 * RedisFrontier — Redis-backed implementation of the URL frontier.
 * Uses a Redis List for FIFO queue and a Redis Set for visited tracking.
 * Suitable for production / distributed crawls.
 */
export class RedisFrontier implements IUrlFrontier {
    private client: RedisClientType;
    private connected = false;
    private readonly logger = Logger.create('RedisFrontier');

    constructor(redisUrl: string) {
        this.client = createClient({ url: redisUrl }) as RedisClientType;
        this.client.on('error', (err) =>
            this.logger.error(`Redis error: ${err.message}`)
        );
    }

    // ── Lifecycle ────────────────────────────────────────────

    /**
     * Connect to Redis. Must be called before any queue operations.
     */
    public async connect(): Promise<void> {
        if (!this.connected) {
            await this.client.connect();
            this.connected = true;
            this.logger.info('Connected to Redis');
        }
    }

    /**
     * Disconnect from Redis gracefully.
     */
    public async disconnect(): Promise<void> {
        if (this.connected) {
            await this.client.quit();
            this.connected = false;
            this.logger.info('Disconnected from Redis');
        }
    }

    // ── IUrlFrontier ─────────────────────────────────────────

    public async add(url: string): Promise<boolean> {
        this.assertConnected();
        const alreadyVisited = await this.client.sIsMember(
            VISITED_KEY,
            url
        );
        if (alreadyVisited) return false;

        await this.client.sAdd(VISITED_KEY, url);
        await this.client.rPush(QUEUE_KEY, url);
        return true;
    }

    public async next(): Promise<string | null> {
        this.assertConnected();
        return await this.client.lPop(QUEUE_KEY);
    }

    public async size(): Promise<number> {
        this.assertConnected();
        return await this.client.lLen(QUEUE_KEY);
    }

    public async hasVisited(url: string): Promise<boolean> {
        this.assertConnected();
        return await this.client.sIsMember(VISITED_KEY, url);
    }

    public async reset(): Promise<void> {
        this.assertConnected();
        await this.client.del(QUEUE_KEY);
        await this.client.del(VISITED_KEY);
        this.logger.info('Frontier reset');
    }

    // ── Private ──────────────────────────────────────────────

    private assertConnected(): void {
        if (!this.connected) {
            throw new Error(
                'RedisFrontier: Not connected. Call connect() first.'
            );
        }
    }
}
