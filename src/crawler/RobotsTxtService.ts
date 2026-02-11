import robotsParser from 'robots-parser';
import { HttpClient } from './HttpClient.js';
import { Logger } from '../utils/Logger.js';

/**
 * RobotsTxtService — Fetches, caches, and evaluates robots.txt rules
 * per domain to determine whether a URL is allowed to be crawled.
 */
export class RobotsTxtService {
    private readonly cache = new Map<
        string,
        ReturnType<typeof robotsParser>
    >();
    private readonly httpClient: HttpClient;
    private readonly userAgent: string;
    private readonly logger = Logger.create('RobotsTxt');

    constructor(httpClient: HttpClient, userAgent: string) {
        this.httpClient = httpClient;
        this.userAgent = userAgent;
    }

    /**
     * Returns true if the given URL is allowed to be crawled
     * according to the domain's robots.txt rules.
     */
    public async isAllowed(url: string): Promise<boolean> {
        try {
            const parsed = new URL(url);
            const origin = parsed.origin;

            if (!this.cache.has(origin)) {
                await this.fetchAndCache(origin);
            }

            const robots = this.cache.get(origin);
            if (!robots) return true;

            return robots.isAllowed(url, this.userAgent) ?? true;
        } catch {
            this.logger.warn(
                `robots.txt check failed for ${url}, allowing by default`
            );
            return true;
        }
    }

    /**
     * Returns the crawl-delay specified in robots.txt for the domain,
     * or null if none is specified.
     */
    public async getCrawlDelay(url: string): Promise<number | null> {
        try {
            const parsed = new URL(url);
            const origin = parsed.origin;

            if (!this.cache.has(origin)) {
                await this.fetchAndCache(origin);
            }

            const robots = this.cache.get(origin);
            if (!robots) return null;

            const delay = robots.getCrawlDelay(this.userAgent);
            return delay ?? null;
        } catch {
            return null;
        }
    }

    // ── Private ──────────────────────────────────────────────

    private async fetchAndCache(origin: string): Promise<void> {
        const robotsUrl = `${origin}/robots.txt`;

        try {
            const response =
                await this.httpClient.fetch(robotsUrl);

            if (response.statusCode === 200 && response.html) {
                const robots = robotsParser(
                    robotsUrl,
                    response.html
                );
                this.cache.set(origin, robots);
                this.logger.debug(
                    `Cached robots.txt for ${origin}`
                );
            }
        } catch {
            this.logger.debug(
                `No robots.txt found for ${origin}`
            );
        }
    }
}
