/**
 * CrawlConfig — Value object encapsulating all configuration
 * parameters for a single crawl job.
 */
export class CrawlConfig {
    public readonly seedUrl: string;
    public readonly maxDepth: number;
    public readonly maxPages: number;
    public readonly concurrency: number;
    public readonly delayMs: number;
    public readonly userAgent: string;
    public readonly respectRobotsTxt: boolean;
    public readonly allowedDomains: string[];

    private static readonly DEFAULT_USER_AGENT =
        'WebCrawlerBot/1.0 (+https://github.com/web-crawler)';

    constructor(params: {
        seedUrl: string;
        maxDepth?: number;
        maxPages?: number;
        concurrency?: number;
        delayMs?: number;
        userAgent?: string;
        respectRobotsTxt?: boolean;
        allowedDomains?: string[];
    }) {
        this.seedUrl = params.seedUrl;
        this.maxDepth = params.maxDepth ?? 3;
        this.maxPages = params.maxPages ?? 100;
        this.concurrency = params.concurrency ?? 5;
        this.delayMs = params.delayMs ?? 200;
        this.userAgent =
            params.userAgent ?? CrawlConfig.DEFAULT_USER_AGENT;
        this.respectRobotsTxt = params.respectRobotsTxt ?? true;
        this.allowedDomains = params.allowedDomains ?? [];

        this.validate();
    }

    // ── Validation ───────────────────────────────────────────

    /**
     * Validates the configuration and throws if any values are invalid.
     */
    private validate(): void {
        if (!this.seedUrl || typeof this.seedUrl !== 'string') {
            throw new Error(
                'CrawlConfig: seedUrl is required and must be a non-empty string.'
            );
        }

        try {
            const parsed = new URL(this.seedUrl);
            if (
                parsed.protocol !== 'http:' &&
                parsed.protocol !== 'https:'
            ) {
                throw new Error(
                    'CrawlConfig: seedUrl must use http or https protocol.'
                );
            }
        } catch (err) {
            if (err instanceof Error && err.message.includes('CrawlConfig')) {
                throw err;
            }
            throw new Error(
                `CrawlConfig: seedUrl is not a valid URL — "${this.seedUrl}".`
            );
        }

        if (this.maxDepth < 0 || !Number.isInteger(this.maxDepth)) {
            throw new Error(
                'CrawlConfig: maxDepth must be a non-negative integer.'
            );
        }

        if (this.maxPages < 1 || !Number.isInteger(this.maxPages)) {
            throw new Error(
                'CrawlConfig: maxPages must be a positive integer.'
            );
        }

        if (
            this.concurrency < 1 ||
            !Number.isInteger(this.concurrency)
        ) {
            throw new Error(
                'CrawlConfig: concurrency must be a positive integer.'
            );
        }

        if (this.delayMs < 0) {
            throw new Error(
                'CrawlConfig: delayMs must be non-negative.'
            );
        }
    }

    // ── Serialization ────────────────────────────────────────

    public toJSON(): object {
        return {
            seedUrl: this.seedUrl,
            maxDepth: this.maxDepth,
            maxPages: this.maxPages,
            concurrency: this.concurrency,
            delayMs: this.delayMs,
            userAgent: this.userAgent,
            respectRobotsTxt: this.respectRobotsTxt,
            allowedDomains: this.allowedDomains
        };
    }
}
