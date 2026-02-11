import { v4 as uuidv4 } from 'uuid';
import { CrawlConfig } from './CrawlConfig.js';
import { CrawlStats } from './CrawlStats.js';
import { PageResult } from './PageResult.js';

/**
 * Valid states for a crawl job.
 */
export type CrawlStatus =
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled';

/**
 * CrawlJob — State machine representing a single crawl operation.
 * Manages lifecycle transitions, page accumulation, and statistics.
 */
export class CrawlJob {
    public readonly id: string;
    public readonly config: CrawlConfig;
    public readonly stats: CrawlStats;
    public readonly createdAt: Date;

    private _status: CrawlStatus = 'pending';
    private _pages: PageResult[] = [];
    private _error: string | null = null;

    constructor(config: CrawlConfig) {
        this.id = uuidv4();
        this.config = config;
        this.stats = new CrawlStats();
        this.createdAt = new Date();
    }

    // ── Getters ──────────────────────────────────────────────

    public get status(): CrawlStatus {
        return this._status;
    }

    public get pages(): ReadonlyArray<PageResult> {
        return this._pages;
    }

    public get error(): string | null {
        return this._error;
    }

    public get isActive(): boolean {
        return (
            this._status === 'pending' ||
            this._status === 'running'
        );
    }

    // ── State Transitions ────────────────────────────────────

    /**
     * Transition: pending → running
     */
    public start(): void {
        this.assertStatus('pending', 'start');
        this._status = 'running';
        this.stats.start();
    }

    /**
     * Transition: running → completed
     */
    public complete(): void {
        this.assertStatus('running', 'complete');
        this._status = 'completed';
        this.stats.stop();
    }

    /**
     * Transition: running → failed
     */
    public fail(reason: string): void {
        this.assertStatus('running', 'fail');
        this._status = 'failed';
        this._error = reason;
        this.stats.stop();
    }

    /**
     * Transition: pending | running → cancelled
     */
    public cancel(): void {
        if (!this.isActive) {
            throw new Error(
                `Cannot cancel job in "${this._status}" state.`
            );
        }
        this._status = 'cancelled';
        this.stats.stop();
    }

    // ── Page Management ──────────────────────────────────────

    /**
     * Adds a successfully crawled page to this job.
     */
    public addPage(page: PageResult): void {
        this._pages.push(page);
        this.stats.incrementVisited();
    }

    /**
     * Records a failed page fetch.
     */
    public recordError(): void {
        this.stats.incrementErrored();
    }

    /**
     * Whether the max page limit has been reached.
     */
    public hasReachedLimit(): boolean {
        return this.stats.totalProcessed >= this.config.maxPages;
    }

    // ── Serialization ────────────────────────────────────────

    public toJSON(): object {
        return {
            id: this.id,
            status: this._status,
            config: this.config.toJSON(),
            stats: this.stats.toJSON(),
            error: this._error,
            pageCount: this._pages.length,
            createdAt: this.createdAt.toISOString()
        };
    }

    /**
     * Full serialization including all pages.
     */
    public toDetailedJSON(): object {
        return {
            ...this.toJSON(),
            pages: this._pages.map((p) => p.toJSON())
        };
    }

    // ── Private ──────────────────────────────────────────────

    private assertStatus(expected: CrawlStatus, action: string): void {
        if (this._status !== expected) {
            throw new Error(
                `Cannot ${action} job: expected "${expected}" but got "${this._status}".`
            );
        }
    }
}
